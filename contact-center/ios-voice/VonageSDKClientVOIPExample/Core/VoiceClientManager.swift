//
//  VoiceClientManager.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Combine
import CallKit
import PushKit
import VonageClientSDKVoice
import AVFoundation

/// Modern VoiceClientManager using Combine for reactive state management
/// This replaces the old UIKit-based CallController with a clean, SwiftUI-friendly architecture
class VoiceClientManager: NSObject, ObservableObject {
    // MARK: - Published State
    @Published var sessionId: String?
    @Published var currentUser: VGUser?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Properties
    /// Voice client - internal access for extensions only (do not access from other classes)
    internal let client: VGVoiceClient
    weak var context: CoreContext!
    private var cancellables = Set<AnyCancellable>()
    
    // CallKit (only on device)
    #if !targetEnvironment(simulator)
    private let callProvider: CXProvider
    private let callController: CXCallController
    #endif
    
    // MARK: - Initialization
    override init() {
        // Initialize Vonage Client with configuration
        let config = VGClientInitConfig(loggingLevel: .info)
        
        // Set other config vars here
        // config.rtcStatsTelemetry = false
        
        #if targetEnvironment(simulator)
        // On simulator: disable CallKit and enable WebSocket invites
        config.enableWebsocketInvites = true
        print("🖥️ Running on simulator - WebSocket invites enabled, CallKit disabled")
        #else
        // On device: use CallKit for native call UI
        print("📱 Running on device - CallKit enabled")
        #endif
        
        self.client = VGVoiceClient(config)
        
        #if targetEnvironment(simulator)
        VGVoiceClient.isUsingCallKit = false
        #else
        VGVoiceClient.isUsingCallKit = true
        #endif
        
        #if !targetEnvironment(simulator)
        // Configure CallKit provider (device only)
        let providerConfig = CXProviderConfiguration()
        providerConfig.supportsVideo = false
        providerConfig.maximumCallGroups = 1
        providerConfig.maximumCallsPerCallGroup = 1
        providerConfig.supportedHandleTypes = [.generic]
        self.callProvider = CXProvider(configuration: providerConfig)
        self.callController = CXCallController()
        #endif
        
        super.init()
        
        // Set delegates
        self.client.delegate = self
        
        #if !targetEnvironment(simulator)
        self.callProvider.setDelegate(self, queue: nil)
        #endif
    }
    
    // MARK: - Authentication
    func login(token: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        client.createSession(token) { [weak self] error, sessionId in
            guard let self else { return }
            
            Task { @MainActor in
                self.isLoading = false
                
                if let error {
                    self.errorMessage = error.localizedDescription
                    onError?(error)
                    return
                }
                
                guard let sessionId else {
                    let error = NSError(domain: "VoiceClientManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "No session ID received"])
                    self.errorMessage = error.localizedDescription
                    onError?(error)
                    return
                }
                
                // Store auth token
                self.context.authToken = token
                self.sessionId = sessionId
                
                // Fetch current user
                self.fetchCurrentUser()
                
                onSuccess?(sessionId)
            }
        }
    }
    
    func loginWithCode(code: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        Task { @MainActor in
            self.isLoading = true
            self.errorMessage = nil
        }
        
        // Use NetworkService to exchange code for token
        context.networkService
            .sendRequest(apiType: CodeLoginAPI(body: LoginRequest(code: code)))
            .sink(
                receiveCompletion: { [weak self] completion in
                    guard let self = self else { return }
                    
                    if case .failure(let error) = completion {
                        Task { @MainActor in
                            self.isLoading = false
                            self.errorMessage = error.localizedDescription
                            onError?(error)
                        }
                    }
                },
                receiveValue: { [weak self] (response: TokenResponse) in
                    guard let self = self else { return }
                    
                    // Store refresh token
                    self.context.refreshToken = response.refreshToken
                    
                    // Login with the received token
                    self.login(token: response.vonageToken, onError: onError, onSuccess: onSuccess)
                }
            )
            .store(in: &cancellables)
    }
    
    func logout(unregisterPushToken: Bool = true, onSuccess: (() -> Void)? = nil) {
        // Optionally unregister push tokens
        // Set to true for user logout (they won't receive calls after logout)
        // Set to false for app termination (allows receiving calls after app closes)
        if unregisterPushToken, let deviceId = context.deviceId {
            client.unregisterDeviceTokens(byDeviceId: deviceId) { [weak self] error in
                if let error {
                    print("❌ Failed to unregister push token: \(error)")
                } else {
                    print("✅ Push tokens unregistered")
                    // Clear deviceId on successful unregistration
                    Task { @MainActor [weak self] in
                        self?.context.deviceId = nil
                    }
                }
            }
        }
        
        // Delete session
        client.deleteSession { [weak self] error in
            guard let self else { return }
            
            Task { @MainActor in
                if let error {
                    self.errorMessage = error.localizedDescription
                } else {
                    // Clear state
                    self.sessionId = nil
                    self.currentUser = nil
                    self.context.authToken = nil
                    self.context.refreshToken = nil
                    self.context.activeCall = nil
                    onSuccess?()
                }
            }
        }
    }
    
    private func fetchCurrentUser() {
        client.getUser("me") { [weak self] error, user in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let error = error {
                    print("❌ Failed to fetch current user: \(error)")
                    return
                }
                
                self.currentUser = user
            }
        }
    }
    
    // MARK: - Push Notifications
    func registerPushTokens(voip: String, user: String) {
        // Convert hex string back to Data
        guard let voipData = Data(hexString: voip) else {
            print("❌ Invalid VOIP token format")
            return
        }
        
        client.registerVoipToken(voipData, isSandbox: true) { [weak self] error, deviceId in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to register VOIP token: \(error)")
                return
            }
            
            guard let deviceId else { return }
            
            Task { @MainActor in
                self.context.deviceId = deviceId
                print("✅ Registered VOIP token with device ID: \(deviceId)")
            }
        }
    }
    
    func processVoipPush(_ payload: PKPushPayload) {
        print("📨 Processing VoIP push notification")
        
        // iOS requires ALL VoIP pushes to be reported to CallKit: https://developer.apple.com/documentation/pushkit/pkpushregistrydelegate/pushregistry(_:didreceiveincomingpushwith:for:completion:)
        
        // Only process Vonage pushes for incoming call invites
        let pushType = VGVoiceClient.vonagePushType(payload.dictionaryPayload)
        guard pushType == .incomingCall else {
            print("⚠️ Ignoring non-incoming call push type: \(pushType)")
            return
        }
        
        // Restore session if needed (async - won't block)
        // This will be needed to answer/reject the call
        restoreSessionIfNeeded()
        
        // This will trigger the invite delegate, which will then report the call to CallKit
        client.processCallInvitePushData(payload.dictionaryPayload)
    }
    
    /// Restores session using stored credentials if no active session exists
    private func restoreSessionIfNeeded() {
        guard sessionId == nil else {
            print("✅ Active session exists: \(sessionId!)")
            return
        }
        
        print("⚠️ No active session - attempting restoration")
        
        // Try auth token first, then refresh token
        if let token = context.authToken {
            restoreSessionWithToken(token)
        } else if let refreshToken = context.refreshToken {
            restoreSessionWithRefreshToken(refreshToken)
        } else {
            print("⚠️ No stored credentials for session restoration")
        }
    }
    
    /// Restores session using stored auth token
    private func restoreSessionWithToken(_ token: String) {
        print("🔄 Restoring session with auth token")
        login(token: token, onError: { error in
            print("❌ Failed to restore session: \(error)")
        }, onSuccess: { sessionId in
            print("✅ Session restored: \(sessionId)")
        })
    }
    
    /// Restores session by refreshing expired token
    private func restoreSessionWithRefreshToken(_ refreshToken: String) {
        print("🔄 Refreshing expired token")
        
        context.networkService
            .sendRequest(apiType: RefreshTokenAPI(refreshToken: refreshToken))
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("❌ Token refresh failed: \(error)")
                    }
                },
                receiveValue: { [weak self] (response: TokenResponse) in
                    guard let self else { return }
                    
                    // Update stored tokens
                    self.context.refreshToken = response.refreshToken
                    
                    // Restore session with new token
                    self.restoreSessionWithToken(response.vonageToken)
                }
            )
            .store(in: &cancellables)
    }
    
    // MARK: - Call Operations
    func startOutboundCall(to callee: String, context: [String: String]? = nil) {
        var callContext = context ?? [:]
        callContext["callee"] = callee
        
        client.serverCall(callContext) { [weak self] error, callId in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to start outbound call: \(error)")
                Task { @MainActor in
                    self.errorMessage = "Failed to start call: \(error.localizedDescription)"
                }
                return
            }
            
            guard let callId, let callUUID = UUID(uuidString: callId) else {
                print("❌ Invalid call ID received")
                return
            }
            
            print("✅ Outbound call started with ID: \(callId)")
            
            // Create call wrapper on MainActor
            Task { @MainActor in
                let call = VGCallWrapper(
                    id: callUUID,
                    callId: callId,
                    callerDisplayName: callee,
                    isInbound: false
                )
                self.context.activeCall = call
            }
            
            #if !targetEnvironment(simulator)
            // Report to CallKit (device only)
            self.reportOutgoingCall(callUUID: callUUID, callee: callee)
            #endif
        }
    }
    
    func answerCall(_ call: VGCallWrapper) {
        client.answer(call.callId) { [weak self] error in
            if let error {
                print("❌ Failed to answer call: \(error)")
                self?.endCall(call, reason: .failed)
                return
            }
            
            print("✅ Answered call: \(call.callId)")
            
            // Update state to active for both simulator and device
            // The delegate method is only called for the remote leg, not for our answer
            Task { @MainActor in
                call.updateState(.active)
            }
        }
    }
    
    func rejectCall(_ call: VGCallWrapper) {
        client.reject(call.callId) { [weak self] error in
            if let error {
                print("❌ Failed to reject call: \(error)")
                self?.endCall(call, reason: .failed)
                return
            }
            
            print("✅ Rejected call: \(call.callId)")
            self?.endCall(call, reason: .remoteEnded)
        }
    }
    
    func hangupCall(_ call: VGCallWrapper) {
        client.hangup(call.callId) { [weak self] error in
            if let error {
                print("❌ Failed to hangup call: \(error)")
                self?.endCall(call, reason: .failed)
                return
            }
            
            print("✅ Hung up call: \(call.callId)")
            // State will be updated via didReceiveHangupForCall delegate for both simulator and device
        }
    }
    
    func muteCall(_ call: VGCallWrapper) {
        client.mute(call.callId) { error in
            if let error {
                print("❌ Failed to mute call: \(error)")
                return
            }
            
            print("✅ Muted call: \(call.callId)")
            Task { @MainActor in
                call.toggleMute()
            }
        }
    }
    
    func unmuteCall(_ call: VGCallWrapper) {
        client.unmute(call.callId) { error in
            if let error {
                print("❌ Failed to unmute call: \(error)")
                return
            }
            
            print("✅ Unmuted call: \(call.callId)")
            Task { @MainActor in
                call.toggleMute()
            }
        }
    }
    
    func holdCall(_ call: VGCallWrapper) {
        // Hold = earmuff + mute
        client.enableEarmuff(call.callId) { [weak self] error in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to enable earmuff: \(error)")
                return
            }
            
            self.client.mute(call.callId) { error in
                if let error {
                    print("❌ Failed to mute for hold: \(error)")
                    return
                }
                
                print("✅ Call on hold: \(call.callId)")
                Task { @MainActor in
                    call.toggleHold()
                    call.updateState(.holding)
                }
            }
        }
    }
    
    func unholdCall(_ call: VGCallWrapper) {
        // Unhold = unmute + disable earmuff
        client.unmute(call.callId) { [weak self] error in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to unmute for unhold: \(error)")
                return
            }
            
            self.client.disableEarmuff(call.callId) { error in
                if let error {
                    print("❌ Failed to disable earmuff: \(error)")
                    return
                }
                
                print("✅ Call resumed: \(call.callId)")
                Task { @MainActor in
                    call.toggleHold()
                    call.updateState(.active)
                }
            }
        }
    }
    
    func enableNoiseSuppression(_ call: VGCallWrapper) {
        client.enableNoiseSuppression(call.callId) { error in
            if let error {
                print("❌ Failed to enable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression enabled: \(call.callId)")
            Task { @MainActor in
                call.toggleNoiseSuppression()
            }
        }
    }
    
    func disableNoiseSuppression(_ call: VGCallWrapper) {
        client.disableNoiseSuppression(call.callId) { error in
            if let error {
                print("❌ Failed to disable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression disabled: \(call.callId)")
            Task { @MainActor in
                call.toggleNoiseSuppression()
            }
        }
    }
    
    func sendDTMF(_ call: VGCallWrapper, digit: String) {
        client.sendDTMF(call.callId, withDigits: digit) { error in
            if let error {
                print("❌ Failed to send DTMF: \(error)")
                return
            }
            
            print("✅ Sent DTMF '\(digit)' on call: \(call.callId)")
        }
    }
    
}

// MARK: - Internal Helpers (For Extension Use Only)
extension VoiceClientManager {
    /// Internal helper to end a call and clean up state.
    /// - Warning: This method is intended for internal use by VoiceClientManager extensions only.
    /// - Parameters:
    ///   - call: The call to end
    ///   - reason: The reason the call ended (for CallKit reporting)
    internal func endCall(_ call: VGCallWrapper, reason: CXCallEndedReason) {
        Task { @MainActor in
            call.updateState(.disconnected)
            
            // Small delay to show disconnected state before clearing
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            if self.context.activeCall?.id == call.id {
                self.context.activeCall = nil
            }
        }
        
        #if !targetEnvironment(simulator)
        // Report to CallKit (device only)
        let endCallAction = CXEndCallAction(call: call.id)
        let transaction = CXTransaction(action: endCallAction)
        callController.request(transaction) { error in
            if let error = error {
                print("❌ Failed to end call in CallKit: \(error)")
            }
        }
        #endif
    }
    
    // MARK: - CallKit Integration Helpers
    #if !targetEnvironment(simulator)
    /// Internal helper to report an outgoing call to CallKit.
    /// - Warning: This method is intended for internal use by VoiceClientManager extensions only.
    internal func reportOutgoingCall(callUUID: UUID, callee: String) {
        let handle = CXHandle(type: .generic, value: callee)
        let startCallAction = CXStartCallAction(call: callUUID, handle: handle)
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("❌ Failed to report outgoing call to CallKit: \(error)")
            }
        }
    }
    
    /// Internal helper to report an incoming call to CallKit.
    /// - Warning: This method is intended for internal use by VoiceClientManager extensions only.
    internal func reportIncomingCall(callUUID: UUID, caller: String) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: caller)
        update.hasVideo = false
        
        callProvider.reportNewIncomingCall(with: callUUID, update: update) { error in
            if let error = error {
                print("❌ Failed to report incoming call to CallKit: \(error)")
            }
        }
    }
    #endif
}
