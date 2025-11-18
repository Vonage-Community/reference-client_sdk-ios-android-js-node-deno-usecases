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
    private let client: VGVoiceClient
    weak var context: CoreContext!
    private var cancellables = Set<AnyCancellable>()
    
    /// Store PushKit completion handler to call after CallKit reports the call
    internal var ongoingPushKitCompletion: () -> Void = { }
    
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
    func login(token: String, isUserInitiated: Bool = true, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        self.isLoading = true
        self.errorMessage = nil
        
        if isUserInitiated {
            // Clean up any existing device registration before logging in (user-initiated login)
            unregisterExistingDeviceIfNeeded { [weak self] in
                guard let self else { return }
                self.createSession(token: token, onError: onError, onSuccess: onSuccess)
            }
        } else {
            // Skip cleanup for session restoration (same user, just reconnecting)
            createSession(token: token, onError: onError, onSuccess: onSuccess)
        }
    }
    
    /// Creates a new session with the given token
    private func createSession(token: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        client.createSession(token) { [weak self] error, sessionId in
            guard let self else { return }
            
            if let error {
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
                onError?(error)
                return
            }
            
            guard let sessionId else {
                let error = NSError(domain: "VoiceClientManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "No session ID received"])
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
                onError?(error)
                return
            }
            
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.isLoading = false
                self.sessionId = sessionId
                self.context.authToken = token
            }
            
            self.fetchCurrentUser()
            onSuccess?(sessionId)
        }
    }
    
    func loginWithCode(code: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        self.isLoading = true
        self.errorMessage = nil
        
        // Use NetworkService to exchange code for token
        context.networkService
            .sendRequest(apiType: CodeLoginAPI(body: LoginRequest(code: code)))
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        Task { @MainActor [weak self] in
                            guard let self else { return }
                            self.isLoading = false
                            self.errorMessage = error.localizedDescription
                        }
                        onError?(error)
                    }
                },
                receiveValue: { [weak self] (response: TokenResponse) in
                    guard let self else { return }
                    // Store refresh token on main actor
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        self.context.refreshToken = response.refreshToken
                    }
                    // Login with the received token
                    self.login(token: response.vonageToken, onError: onError, onSuccess: onSuccess)
                }
            )
            .store(in: &cancellables)
    }
    
    func logout(onSuccess: (() -> Void)? = nil) {
        // Always unregister push tokens on explicit logout
        // User won't receive calls after logging out
        unregisterDeviceTokens { [weak self] in
            guard let self else { return }
            
            // Delete session
            self.client.deleteSession { [weak self] error in
                guard let self else { return }
                
                if let error {
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        self.errorMessage = error.localizedDescription
                    }
                } else {
                    // Clear state
                    Task { @MainActor [weak self] in
                        guard let self else { return }
                        self.sessionId = nil
                        self.currentUser = nil
                        self.context.authToken = nil
                        self.context.refreshToken = nil
                        self.context.activeCall = nil
                    }
                    onSuccess?()
                }
            }
        }
    }
    
    // MARK: - Push Token Management
    
    /// Unregisters the current device tokens if a device ID exists
    private func unregisterDeviceTokens(completion: @escaping () -> Void) {
        guard let deviceId = context.deviceId else {
            completion()
            return
        }
        
        client.unregisterDeviceTokens(byDeviceId: deviceId) { [weak self] error in
            if let error {
                print("❌ Failed to unregister push token: \(error)")
            } else {
                print("✅ Push tokens unregistered for device: \(deviceId)")
            }
            
            // Clear deviceId regardless of success/failure
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.context.deviceId = nil
            }
            
            completion()
        }
    }
    
    /// Unregisters any existing device before login to prevent token accumulation
    /// This creates a temporary session with stored credentials if needed
    private func unregisterExistingDeviceIfNeeded(completion: @escaping () -> Void) {
        // Check if we have a previously registered device
        guard let existingDeviceId = context.deviceId else {
            print("✅ No existing device ID - skipping cleanup")
            completion()
            return
        }
        
        // Check if we have a valid auth token to perform cleanup
        guard let authToken = context.authToken else {
            print("⚠️ No auth token for cleanup - clearing stale device ID")
            context.deviceId = nil
            completion()
            return
        }
        
        print("🧹 Cleaning up existing device: \(existingDeviceId)")
        
        // Create temporary session to unregister the old device
        client.createSession(authToken) { [weak self] error, sessionId in
            guard let self else {
                completion()
                return
            }
            
            if let error {
                print("⚠️ Cleanup session failed: \(error.localizedDescription)")
                // Clear stale device ID and continue
                self.context.deviceId = nil
                completion()
                return
            }
            
            guard let sessionId = sessionId else {
                print("⚠️ No session ID for cleanup")
                self.context.deviceId = nil
                completion()
                return
            }
            
            print("✅ Cleanup session created: \(sessionId)")
            
            // Unregister the old device using the reusable method
            self.unregisterDeviceTokens { [weak self] in
                guard let self else { return }
                
                // Delete the cleanup session
                self.client.deleteSession { error in
                    if let error {
                        print("⚠️ Failed to delete cleanup session: \(error.localizedDescription)")
                    } else {
                        print("✅ Cleanup session deleted")
                    }
                    completion()
                }
            }
        }
    }
    
    private func fetchCurrentUser() {
        client.getUser("me") { [weak self] error, user in
            if let error = error {
                print("❌ Failed to fetch current user: \(error)")
                return
            }
            Task { @MainActor [weak self] in
                guard let self else { return }
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
            
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.context.deviceId = deviceId
            }
            print("✅ Registered VOIP token with device ID: \(deviceId)")
        }
    }
    
    func processVoipPush(_ payload: PKPushPayload, completion: @escaping () -> Void) {
        print("📨 Processing VoIP push notification")
        
        // iOS requires ALL VoIP pushes to be reported to CallKit: https://developer.apple.com/documentation/pushkit/pkpushregistrydelegate/pushregistry(_:didreceiveincomingpushwith:for:completion:)
        
        // Only process Vonage pushes for incoming call invites
        let pushType = VGVoiceClient.vonagePushType(payload.dictionaryPayload)
        guard pushType == .incomingCall else {
            print("⚠️ Ignoring non-incoming call push type: \(pushType)")
            completion()
            return
        }
        
        // Store the completion handler to be called after CallKit reports the call
        self.ongoingPushKitCompletion = completion
        
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
        // Skip device cleanup - this is session restoration, not user switching
        login(token: token, isUserInitiated: false, onError: { error in
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
    func startOutboundCall(to callee: String, context: [String: String] = [:]) {
        var callContext = context
        callContext["callee"] = callee
        
        client.serverCall(callContext) { [weak self] error, callId in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to start outbound call: \(error)")
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.errorMessage = "Failed to start call: \(error.localizedDescription)"
                }
                return
            }
            
            guard let callId, let callUUID = UUID(uuidString: callId) else {
                print("❌ Invalid call ID received")
                return
            }
            
            print("✅ Outbound call started with ID: \(callId)")
            let call = VGCallWrapper(
                id: callUUID,
                callId: callId,
                callerDisplayName: callee,
                isInbound: false
            )
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.context.activeCall = call
            }
            
            #if !targetEnvironment(simulator)
            // Request to CallKit (device only)
            // We call it after the call's been established to ensure the call ID is valid
            self.requestStartCallTransaction(callUUID: callUUID, callee: callee)
            #endif
        }
    }
    
    func answerCall(_ call: VGCallWrapper, completion: ((Error?) -> Void)? = nil) {
        let callId = call.callId
        client.answer(callId) { [weak self] error in
            completion?(error)
            
            guard let self else { return }
            
            if let error {
                print("❌ Failed to answer call: \(error)")
                if let call = self.context.activeCall, call.callId == callId {
                    self.cleanUpCall(call, reason: .failed)
                }
                return
            }
            
            print("✅ Answered call: \(callId)")
            // Update state to active for both simulator and device
            // The delegate method is only called for the remote leg, not for our answer
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.updateState(.active)
            }
        }
    }
    
    func rejectCall(_ call: VGCallWrapper, completion: ((Error?) -> Void)? = nil) {
        let callId = call.callId
        client.reject(callId) { [weak self] error in
            completion?(error)
            
            guard let self else { return }
            
            if let error {
                print("❌ Failed to reject call: \(error)")
                if let call = self.context.activeCall, call.callId == callId {
                    self.cleanUpCall(call, reason: .failed)
                }
                return
            }
            
            print("✅ Rejected call: \(callId)")
            // Update State
            if let call = self.context.activeCall, call.callId == callId {
                self.cleanUpCall(call, reason: .remoteEnded)
            }
        }
    }
    
    func hangupCall(_ call: VGCallWrapper, completion: ((Error?) -> Void)? = nil) {
        let callId = call.callId
        client.hangup(callId) { [weak self] error in
            completion?(error)
            
            guard let self else { return }
            
            if let error {
                print("❌ Failed to hangup call: \(error)")
                if let call = self.context.activeCall, call.callId == callId {
                    self.cleanUpCall(call, reason: .failed)
                }
                return
            }
            
            print("✅ Hung up call: \(callId)")
            // State will be updated via didReceiveHangupForCall delegate for both simulator and device
        }
    }
    
    func muteCall(_ call: VGCallWrapper) {
        let callId = call.callId
        client.mute(callId) { [weak self] error in
            if let error {
                print("❌ Failed to mute call: \(error)")
                return
            }
            
            print("✅ Muted call: \(callId)")
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.toggleMute()
            }
        }
    }
    
    func unmuteCall(_ call: VGCallWrapper) {
        let callId = call.callId
        client.unmute(callId) { [weak self] error in
            if let error {
                print("❌ Failed to unmute call: \(error)")
                return
            }
            
            print("✅ Unmuted call: \(callId)")
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.toggleMute()
            }
        }
    }
    
    func holdCall(_ call: VGCallWrapper) {
        // Hold = earmuff + mute
        let callId = call.callId
        client.enableEarmuff(callId) { [weak self] error in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to enable earmuff: \(error)")
                return
            }
            
            self.client.mute(callId) { [weak self] error in
                if let error {
                    print("❌ Failed to mute for hold: \(error)")
                    return
                }
                
                print("✅ Call on hold: \(callId)")
                Task { @MainActor [weak self] in
                    guard let self = self,
                          let call = self.context.activeCall,
                          call.callId == callId else { return }
                    call.toggleHold()
                    call.updateState(.holding)
                }
            }
        }
    }
    
    func unholdCall(_ call: VGCallWrapper) {
        // Unhold = unmute + disable earmuff
        let callId = call.callId
        client.unmute(callId) { [weak self] error in
            guard let self else { return }
            
            if let error {
                print("❌ Failed to unmute for unhold: \(error)")
                return
            }
            
            self.client.disableEarmuff(callId) { [weak self] error in
                if let error {
                    print("❌ Failed to disable earmuff: \(error)")
                    return
                }
                
                print("✅ Call resumed: \(callId)")
                Task { @MainActor [weak self] in
                    guard let self = self,
                          let call = self.context.activeCall,
                          call.callId == callId else { return }
                    call.toggleHold()
                    call.updateState(.active)
                }
            }
        }
    }
    
    func enableNoiseSuppression(_ call: VGCallWrapper) {
        let callId = call.callId
        client.enableNoiseSuppression(callId) { [weak self] error in
            if let error {
                print("❌ Failed to enable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression enabled: \(callId)")
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.toggleNoiseSuppression()
            }
        }
    }
    
    func disableNoiseSuppression(_ call: VGCallWrapper) {
        let callId = call.callId
        client.disableNoiseSuppression(callId) { [weak self] error in
            if let error {
                print("❌ Failed to disable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression disabled: \(callId)")
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.toggleNoiseSuppression()
            }
        }
    }
    
    func sendDTMF(_ call: VGCallWrapper, digit: String) {
        let callId = call.callId
        client.sendDTMF(callId, withDigits: digit) { error in
            if let error {
                print("❌ Failed to send DTMF: \(error)")
                return
            }
            
            print("✅ Sent DTMF '\(digit)' on call: \(callId)")
        }
    }
    
}

// MARK: - Internal Helpers (For Extension Use Only)
extension VoiceClientManager {
    /// Internal helper to clean up a call from the state.
    /// - Warning: This method is intended for internal use by VoiceClientManager extensions only.
    /// - Parameters:
    ///   - call: The call to clean up
    ///   - reason: The reason the call ended (for CallKit reporting)
    internal func cleanUpCall(_ call: VGCallWrapper, reason: CXCallEndedReason) {
        
        #if !targetEnvironment(simulator)
        // Report to CallKit that call has ended
        callProvider.reportCall(with: call.id, endedAt: Date.now, reason: reason)
        #endif
        
        // Clean up call state
        Task { @MainActor [weak self] in
            guard let self = self,
                  let call = self.context.activeCall else { return }
            
            call.updateState(.disconnected)
            
            // Small delay to show disconnected state before clearing
            try? await Task.sleep(for: .seconds(1))
            if self.context.activeCall?.id == call.id {
                self.context.activeCall = nil
            }
        }
    }
}


#if !targetEnvironment(simulator)
// MARK: - CallKit Integration Helpers (Device only)
//// These methods are used to request CallKit actions from app UI
/// Or to report call state changes to CallKit
extension VoiceClientManager {
    func reportIncomingCall(callUUID: UUID, caller: String, type: VGVoiceChannelType, completion: @escaping () -> Void) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: type == .phone ? .phoneNumber : .generic, value: caller)
        update.hasVideo = false
        update.supportsDTMF = true
        update.supportsHolding = true
        
        callProvider.reportNewIncomingCall(with: callUUID, update: update) { error in
            if let error = error {
                print("❌ Failed to report incoming call to CallKit: \(error)")
            } else {
                print("✅ Incoming call reported successfully to CallKit")
            }
            // This is where we finally invoke completion handler for PushKit
            completion()
        }
    }
    
    func reportOutgoingCallConnected(callUUID: UUID) {
        callProvider.reportOutgoingCall(with: callUUID, connectedAt: Date.now)
        print("✅ Outgoing call connected reported to CallKit")
    }
    
    func requestStartCallTransaction(callUUID: UUID, callee: String) {
        let handle = CXHandle(type: .generic, value: callee)
        let startCallAction = CXStartCallAction(call: callUUID, handle: handle)
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { [weak self] error in
            guard let self else { return }
            if let error = error {
                print("❌ Error requesting start call transaction: \(error)")
            } else {
                print("✅ Start Call transaction requested succesfully")
                self.callProvider.reportOutgoingCall(with: callUUID, startedConnectingAt: Date.now)
                print("✅ Outgoing call started connecting reported to CallKit")
            }
        }
    }

    func requestEndCallTransaction(_ call: VGCallWrapper) {
        let endCallAction = CXEndCallAction(call: call.id)
        let transaction = CXTransaction(action: endCallAction)
        callController.request(transaction) { error in
            if let error {
                print("❌ Error requesting end call transaction: \(error)")
            } else {
                print("✅ End call transaction requested successfully")
            }
        }
    }

    func requestAnswerCallTransaction(_ call: VGCallWrapper) {
        let answerCallAction = CXAnswerCallAction(call: call.id)
        let transaction = CXTransaction(action: answerCallAction)
        callController.request(transaction) { error in
            if let error {
                print("❌ Error requesting answer call transaction: \(error)")
            } else {
                print("✅ Answer call transaction requested successfully")
            }
        }
    }
    
    func requestMuteCallTransaction(_ call: VGCallWrapper, isMuted: Bool) {
        let muteAction = CXSetMutedCallAction(call: call.id, muted: isMuted)
        let transaction = CXTransaction(action: muteAction)
        callController.request(transaction) { error in
            if let error {
                print("❌ Error requesting mute call transaction: \(error)")
            } else {
                print("✅ Mute call transaction requested successfully (muted: \(isMuted))")
            }
        }
    }
    
    func requestHoldCallTransaction(_ call: VGCallWrapper, isOnHold: Bool) {
        let holdAction = CXSetHeldCallAction(call: call.id, onHold: isOnHold)
        let transaction = CXTransaction(action: holdAction)
        callController.request(transaction) { error in
            if let error {
                print("❌ Error requesting hold call transaction: \(error)")
            } else {
                print("✅ Hold call transaction requested successfully (onHold: \(isOnHold))")
            }
        }
    }
}
#endif
