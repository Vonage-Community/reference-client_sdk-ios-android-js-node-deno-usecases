//
//  VoiceClientManager.swift
//  VonageSDKClientVOIPExample
//
//  Created by Copilot on 11/11/2025.
//

import Foundation
import Combine
import CallKit
import PushKit
import VonageClientSDKVoice

/// Modern VoiceClientManager using Combine for reactive state management
/// This replaces the old UIKit-based CallController with a clean, SwiftUI-friendly architecture
class VoiceClientManager: NSObject, ObservableObject {
    // MARK: - Published State
    @Published var sessionId: String?
    @Published var currentUser: VGUser?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Properties
    private let client: VGVoiceClient
    private weak var context: CoreContext?
    private var cancellables = Set<AnyCancellable>()
    
    // CallKit
    private let callProvider: CXProvider
    private let callController = CXCallController()
    
    // MARK: - Initialization
    init(client: VGVoiceClient, context: CoreContext? = nil) {
        self.client = client
        self.context = context
        
        // Configure CallKit provider
        let providerConfig = CXProviderConfiguration()
        providerConfig.supportsVideo = false
        providerConfig.maximumCallGroups = 1
        providerConfig.maximumCallsPerCallGroup = 1
        providerConfig.supportedHandleTypes = [.generic]
        self.callProvider = CXProvider(configuration: providerConfig)
        
        super.init()
        
        // Set delegates
        self.client.delegate = self
        self.callProvider.setDelegate(self, queue: nil)
    }
    
    func setContext(_ context: CoreContext) {
        self.context = context
    }
    
    // MARK: - Authentication
    func login(token: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        client.createSession(token) { [weak self] error, sessionId in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let error = error {
                    self.errorMessage = error.localizedDescription
                    onError?(error)
                    return
                }
                
                guard let sessionId = sessionId else {
                    let error = NSError(domain: "VoiceClientManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "No session ID received"])
                    self.errorMessage = error.localizedDescription
                    onError?(error)
                    return
                }
                
                // Store auth token
                self.context?.authToken = token
                self.sessionId = sessionId
                
                // Fetch current user
                self.fetchCurrentUser()
                
                onSuccess?(sessionId)
            }
        }
    }
    
    func loginWithCode(code: String, onError: ((Error) -> Void)? = nil, onSuccess: ((String) -> Void)? = nil) {
        DispatchQueue.main.async {
            self.isLoading = true
            self.errorMessage = nil
        }
        
        // Use NetworkController to exchange code for token
        NetworkController()
            .sendRequest(apiType: CodeLoginAPI(body: LoginRequest(code: code)))
            .sink(
                receiveCompletion: { [weak self] completion in
                    guard let self = self else { return }
                    
                    if case .failure(let error) = completion {
                        DispatchQueue.main.async {
                            self.isLoading = false
                            self.errorMessage = error.localizedDescription
                            onError?(error)
                        }
                    }
                },
                receiveValue: { [weak self] (response: TokenResponse) in
                    guard let self = self else { return }
                    
                    // Store refresh token
                    self.context?.refreshToken = response.refreshToken
                    
                    // Login with the received token
                    self.login(token: response.vonageToken, onError: onError, onSuccess: onSuccess)
                }
            )
            .store(in: &cancellables)
    }
    
    func logout(onSuccess: (() -> Void)? = nil) {
        // Unregister push tokens - commented out as API may have changed
        // if let deviceId = context?.deviceId {
        //     client.unregisterDevicePushToken(deviceId) { error in
        //         if let error = error {
        //             print("❌ Failed to unregister push token: \(error)")
        //         }
        //     }
        // }
        
        // Delete session
        client.deleteSession { [weak self] error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                if let error = error {
                    self.errorMessage = error.localizedDescription
                } else {
                    // Clear state
                    self.sessionId = nil
                    self.currentUser = nil
                    self.context?.authToken = nil
                    self.context?.refreshToken = nil
                    self.context?.deviceId = nil
                    self.context?.activeCall = nil
                    self.context?.lastActiveCall = nil
                    
                    onSuccess?()
                }
            }
        }
    }
    
    private func fetchCurrentUser() {
        client.getUser("me") { [weak self] error, user in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
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
            if let error = error {
                print("❌ Failed to register VOIP token: \(error)")
                return
            }
            
            guard let deviceId = deviceId else { return }
            
            DispatchQueue.main.async {
                self?.context?.deviceId = deviceId
                print("✅ Registered VOIP token with device ID: \(deviceId)")
            }
        }
    }
    
    func processVoipPush(_ payload: PKPushPayload) {
        client.processCallInvitePushData(payload.dictionaryPayload)
    }
    
    // MARK: - Call Operations
    func startOutboundCall(to callee: String, context: [String: String]? = nil) {
        var callContext = context ?? [:]
        callContext["callee"] = callee
        
        client.serverCall(callContext) { [weak self] error, callId in
            guard let self = self else { return }
            
            if let error = error {
                print("❌ Failed to start outbound call: \(error)")
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to start call: \(error.localizedDescription)"
                }
                return
            }
            
            guard let callId = callId, let callUUID = UUID(uuidString: callId) else {
                print("❌ Invalid call ID received")
                return
            }
            
            print("✅ Outbound call started with ID: \(callId)")
            
            // Create call wrapper
            let call = VGCallWrapper(
                id: callUUID,
                callId: callId,
                callerDisplayName: callee,
                isInbound: false
            )
            
            DispatchQueue.main.async {
                self.context?.activeCall = call
                self.context?.lastActiveCall = call
            }
            
            // Report to CallKit
            self.reportOutgoingCall(callUUID: callUUID, callee: callee)
        }
    }
    
    func answerCall(_ call: VGCallWrapper) {
        client.answer(call.callId) { [weak self] error in
            if let error = error {
                print("❌ Failed to answer call: \(error)")
                self?.endCall(call, reason: .failed)
                return
            }
            
            print("✅ Answered call: \(call.callId)")
        }
    }
    
    func rejectCall(_ call: VGCallWrapper) {
        client.reject(call.callId) { [weak self] error in
            if let error = error {
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
            if let error = error {
                print("❌ Failed to hangup call: \(error)")
                self?.endCall(call, reason: .failed)
                return
            }
            
            print("✅ Hung up call: \(call.callId)")
        }
    }
    
    func muteCall(_ call: VGCallWrapper) {
        client.mute(call.callId) { error in
            if let error = error {
                print("❌ Failed to mute call: \(error)")
                return
            }
            
            print("✅ Muted call: \(call.callId)")
            call.toggleMute()
        }
    }
    
    func unmuteCall(_ call: VGCallWrapper) {
        client.unmute(call.callId) { error in
            if let error = error {
                print("❌ Failed to unmute call: \(error)")
                return
            }
            
            print("✅ Unmuted call: \(call.callId)")
            call.toggleMute()
        }
    }
    
    func holdCall(_ call: VGCallWrapper) {
        // Hold = mute + earmuff
        client.mute(call.callId) { [weak self] error in
            if let error = error {
                print("❌ Failed to mute for hold: \(error)")
                return
            }
            
            self?.client.enableEarmuff(call.callId) { error in
                if let error = error {
                    print("❌ Failed to enable earmuff: \(error)")
                    return
                }
                
                print("✅ Call on hold: \(call.callId)")
                call.toggleHold()
                call.updateState(.holding)
            }
        }
    }
    
    func unholdCall(_ call: VGCallWrapper) {
        // Unhold = unmute + disable earmuff
        client.unmute(call.callId) { [weak self] error in
            if let error = error {
                print("❌ Failed to unmute for unhold: \(error)")
                return
            }
            
            self?.client.disableEarmuff(call.callId) { error in
                if let error = error {
                    print("❌ Failed to disable earmuff: \(error)")
                    return
                }
                
                print("✅ Call resumed: \(call.callId)")
                call.toggleHold()
                call.updateState(.active)
            }
        }
    }
    
    func enableNoiseSuppression(_ call: VGCallWrapper) {
        client.enableNoiseSuppression(call.callId) { error in
            if let error = error {
                print("❌ Failed to enable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression enabled: \(call.callId)")
            call.toggleNoiseSuppression()
        }
    }
    
    func disableNoiseSuppression(_ call: VGCallWrapper) {
        client.disableNoiseSuppression(call.callId) { error in
            if let error = error {
                print("❌ Failed to disable noise suppression: \(error)")
                return
            }
            
            print("✅ Noise suppression disabled: \(call.callId)")
            call.toggleNoiseSuppression()
        }
    }
    
    func sendDTMF(_ call: VGCallWrapper, digit: String) {
        client.sendDTMF(call.callId, withDigits: digit) { error in
            if let error = error {
                print("❌ Failed to send DTMF: \(error)")
                return
            }
            
            print("✅ Sent DTMF '\(digit)' on call: \(call.callId)")
        }
    }
    
    private func endCall(_ call: VGCallWrapper, reason: CXCallEndedReason) {
        DispatchQueue.main.async { [weak self] in
            call.updateState(.disconnected)
            
            // Small delay to show disconnected state before clearing
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                if self?.context?.activeCall?.id == call.id {
                    self?.context?.activeCall = nil
                }
            }
        }
        
        // Report to CallKit
        let endCallAction = CXEndCallAction(call: call.id)
        let transaction = CXTransaction(action: endCallAction)
        callController.request(transaction) { error in
            if let error = error {
                print("❌ Failed to end call in CallKit: \(error)")
            }
        }
    }
    
    // MARK: - CallKit Integration
    private func reportOutgoingCall(callUUID: UUID, callee: String) {
        let handle = CXHandle(type: .generic, value: callee)
        let startCallAction = CXStartCallAction(call: callUUID, handle: handle)
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("❌ Failed to report outgoing call to CallKit: \(error)")
            }
        }
    }
    
    private func reportIncomingCall(callUUID: UUID, caller: String) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: caller)
        update.hasVideo = false
        
        callProvider.reportNewIncomingCall(with: callUUID, update: update) { error in
            if let error = error {
                print("❌ Failed to report incoming call to CallKit: \(error)")
            }
        }
    }
}

// MARK: - VGVoiceClientDelegate
extension VoiceClientManager: VGVoiceClientDelegate {
    func client(_ client: VGBaseClient, didReceiveSessionErrorWith reason: VGSessionErrorReason) {
        let message: String
        switch reason {
        case .tokenExpired:
            message = "Token has expired"
        case .transportClosed:
            message = "Connection closed"
        case .pingTimeout:
            message = "Connection timeout"
        case .unknown:
            message = "Unknown session error"
        @unknown default:
            message = "Unknown session error"
        }
        
        print("❌ Session error: \(message)")
        
        DispatchQueue.main.async { [weak self] in
            self?.errorMessage = "Session error: \(message)"
            
            // Try to reconnect if we have a valid token
            if let token = self?.context?.authToken {
                self?.login(token: token)
            } else {
                // Clear session if no token available
                self?.sessionId = nil
                self?.currentUser = nil
            }
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveInviteForCall callId: VGCallId, from caller: String, with type: VGVoiceChannelType) {
        print("📞 Incoming call from: \(caller)")
        
        guard let callUUID = UUID(uuidString: callId) else {
            print("❌ Invalid call ID: \(callId)")
            return
        }
        
        // Create call wrapper
        let call = VGCallWrapper(
            id: callUUID,
            callId: callId,
            callerDisplayName: caller,
            isInbound: true
        )
        
        DispatchQueue.main.async { [weak self] in
            self?.context?.activeCall = call
            self?.context?.lastActiveCall = call
        }
        
        // Report to CallKit
        reportIncomingCall(callUUID: callUUID, caller: caller)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveHangupForCall callId: VGCallId, withQuality callQuality: VGRTCQuality, reason: VGHangupReason) {
        print("📴 Call ended: \(callId), reason: \(reason)")
        
        guard let call = context?.activeCall, call.callId == callId else { return }
        
        let cxReason: CXCallEndedReason
        switch reason {
        case .remoteReject:
            cxReason = .declinedElsewhere
        case .remoteHangup:
            cxReason = .remoteEnded
        case .localHangup:
            cxReason = .unanswered
        case .mediaTimeout:
            cxReason = .failed
        case .remoteNoAnswerTimeout:
            cxReason = .unanswered
        case .unknown:
            cxReason = .failed
        @unknown default:
            cxReason = .failed
        }
        
        endCall(call, reason: cxReason)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveInviteCancelForCall callId: VGCallId, with reason: VGVoiceInviteCancelReason) {
        print("📴 Call invite cancelled: \(callId), reason: \(reason)")
        
        guard let call = context?.activeCall, call.callId == callId else { return }
        
        let cxReason: CXCallEndedReason
        switch reason {
        case .answeredElsewhere:
            cxReason = .answeredElsewhere
        case .rejectedElsewhere:
            cxReason = .declinedElsewhere
        case .remoteCancel:
            cxReason = .remoteEnded
        case .remoteTimeout:
            cxReason = .unanswered
        case .unknown:
            cxReason = .failed
        @unknown default:
            cxReason = .failed
        }
        
        endCall(call, reason: cxReason)
    }
    
    func voiceClient(_ client: VGVoiceClient, didUpdateCall callId: VGCallId, with legId: String, status: VGLegStatus) {
        print("🔄 Call status updated: \(callId), status: \(status)")
        
        guard let call = context?.activeCall, call.callId == callId else { return }
        
        if status == .answered {
            DispatchQueue.main.async {
                call.updateState(.active)
            }
        }
    }
}

// MARK: - CXProviderDelegate
extension VoiceClientManager: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        print("📞 CallKit provider reset")
    }
    
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard let call = context?.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        answerCall(call)
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = context?.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        if call.isInbound && call.state == .ringing {
            rejectCall(call)
        } else {
            hangupCall(call)
        }
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        guard let call = context?.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        // Outbound call already started in startOutboundCall
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        guard let call = context?.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        if action.isMuted {
            muteCall(call)
        } else {
            unmuteCall(call)
        }
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        guard let call = context?.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        if action.isOnHold {
            holdCall(call)
        } else {
            unholdCall(call)
        }
        
        action.fulfill()
    }
}

// MARK: - Data Extension
extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            let bytes = hexString[i..<j]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
            i = j
        }
        self = data
    }
}
