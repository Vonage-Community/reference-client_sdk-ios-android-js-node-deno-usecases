//
//  VoiceClientManager+VGVoiceClientDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Foundation
import CallKit
import VonageClientSDKVoice

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
        
        Task { @MainActor [weak self] in
            self?.errorMessage = "Session error: \(message)"
        }
        // Try to reconnect if we have a valid token
        if let token = self.context.authToken {
            self.login(token: token)
        } else {
            // Clear session if no token available
            Task { @MainActor [weak self] in
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

        let call = VGCallWrapper(
            id: callUUID,
            callId: callId,
            callerDisplayName: caller,
            isInbound: true
        )
        
        Task { @MainActor [weak self] in
            guard let self = self else { return }
            self.context.activeCall = call
        }
        
        #if !targetEnvironment(simulator)
        // Report to CallKit (device only)
        reportIncomingCall(callUUID: callUUID, caller: caller, type: type, completion: ongoingPushKitCompletion)
        #endif
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveHangupForCall callId: VGCallId, withQuality callQuality: VGRTCQuality, reason: VGHangupReason) {
        print("📴 Call ended: \(callId), reason: \(reason)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        let cxReason: CXCallEndedReason = switch reason {
        case .remoteReject:
            .declinedElsewhere
        case .remoteHangup:
            .remoteEnded
        case .localHangup:
            .remoteEnded
        case .mediaTimeout:
            .failed
        case .remoteNoAnswerTimeout:
            .unanswered
        case .unknown:
            .failed
        @unknown default:
            .failed
        }
        
        cleanUpCall(call, reason: cxReason)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveLegStatusUpdateForCall callId: VGCallId, withLegId legId: String, andStatus status: VGLegStatus) {
        print("🔄 Call status updated: \(callId), status: \(status)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        if status == .answered {
            Task { @MainActor [weak self] in
                guard let self = self,
                      let call = self.context.activeCall,
                      call.callId == callId else { return }
                call.updateState(.active)
            }
            
            #if !targetEnvironment(simulator)
            // Report to CallKit (device only)
            reportOutgoingCallConnected(callUUID: call.id)
            #endif
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveInviteCancelForCall callId: VGCallId, with reason: VGVoiceInviteCancelReason) {
        print("📴 Call invite cancelled: \(callId), reason: \(reason)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        let cxReason: CXCallEndedReason = switch reason {
        case .answeredElsewhere:
            .answeredElsewhere
        case .rejectedElsewhere:
            .declinedElsewhere
        case .remoteCancel:
            .remoteEnded
        case .remoteTimeout:
            .unanswered
        case .unknown:
            .failed
        @unknown default:
            .failed
        }
        
        cleanUpCall(call, reason: cxReason)
    }
    
    // MARK: - Optional Delegate Methods
    
    func voiceClient(_ client: VGVoiceClient, didReceiveDTMFForCall callId: VGCallId, withLegId legId: String, andDigits digits: String) {
        print("🔢 DTMF received - Call: \(callId), Leg: \(legId), Digits: '\(digits)'")
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMuteForCall callId: VGCallId, withLegId legId: String, andStatus isMuted: Bool) {
        print("🔇 Mute status changed - Call: \(callId), Leg: \(legId), Muted: \(isMuted)")
        
        // Only update our call state if this is for our own leg (callId == legId)
        guard callId == legId else { return }
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Update the mute state if it doesn't match
        Task { @MainActor [weak self] in
            guard let self = self,
                  let call = self.context.activeCall,
                  call.callId == callId else { return }
            if call.isMuted != isMuted {
                call.toggleMute()
            }
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveCallTransferForCall callId: VGCallId, withConversationId conversationId: String) {
        print("🔀 Call transferred - Call: \(callId), Conversation: \(conversationId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Set call to active state after transfer
        Task { @MainActor [weak self] in
            guard let self = self,
                  let call = self.context.activeCall,
                  call.callId == callId else { return }
            call.updateState(.active)
        }
        
        #if !targetEnvironment(simulator)
        // Report to CallKit (device only)
        reportOutgoingCallConnected(callUUID: call.id)
        #endif
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaDisconnectForCall callId: VGCallId, reason: VGCallDisconnectReason) {
        print("❌ Media disconnected - Call: \(callId), Reason: \(reason)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Clean up the call - it's been disconnected
        cleanUpCall(call, reason: .failed)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaReconnectingForCall callId: VGCallId) {
        print("🔄 Media reconnecting - Call: \(callId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Transition to reconnecting state
        Task { @MainActor [weak self] in
            guard let self = self,
                  let call = self.context.activeCall,
                  call.callId == callId else { return }
            call.updateState(.reconnecting)
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaReconnectionForCall callId: VGCallId) {
        print("✅ Media reconnected - Call: \(callId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Transition back to active state
        Task { @MainActor [weak self] in
            guard let self = self,
                  let call = self.context.activeCall,
                  call.callId == callId else { return }
            call.updateState(.active)
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveRtcStatsUpdate rtcStats: VGRTCStats, forCall callId: VGCallId) {
        // Only log RTC stats in verbose/debug mode to avoid log pollution
        #if DEBUG
        // Uncomment for verbose RTC statistics logging
        // print("📊 RTC Stats - Call: \(callId), Audio: \(rtcStats)")
        #endif
    }
}
