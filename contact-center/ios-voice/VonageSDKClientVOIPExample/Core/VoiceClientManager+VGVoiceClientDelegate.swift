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
        
        DispatchQueue.main.async { [weak self] in
            self?.errorMessage = "Session error: \(message)"
            
            // Try to reconnect if we have a valid token
            if let token = self?.context.authToken {
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
            guard let self else { return }
            self.context.activeCall = call
            self.context.lastActiveCall = call
        }
        
        #if !targetEnvironment(simulator)
        // Report to CallKit (device only)
        reportIncomingCall(callUUID: callUUID, caller: caller)
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
            .unanswered
        case .mediaTimeout:
            .failed
        case .remoteNoAnswerTimeout:
            .unanswered
        case .unknown:
            .failed
        @unknown default:
            .failed
        }
        
        endCall(call, reason: cxReason)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveLegStatusUpdateForCall callId: VGCallId, withLegId legId: String, andStatus status: VGLegStatus) {
        print("🔄 Call status updated: \(callId), status: \(status)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        if status == .answered {
            DispatchQueue.main.async {
                call.updateState(.active)
            }
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
        
        endCall(call, reason: cxReason)
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
        if call.isMuted != isMuted {
            DispatchQueue.main.async {
                call.toggleMute()
            }
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveCallTransferForCall callId: VGCallId, withConversationId conversationId: String) {
        print("🔀 Call transferred - Call: \(callId), Conversation: \(conversationId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Set call to active state after transfer
        DispatchQueue.main.async {
            call.updateState(.active)
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaDisconnectForCall callId: VGCallId, reason: VGCallDisconnectReason) {
        print("❌ Media disconnected - Call: \(callId), Reason: \(reason)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Clean up the call - it's been disconnected
        endCall(call, reason: .failed)
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaReconnectingForCall callId: VGCallId) {
        print("🔄 Media reconnecting - Call: \(callId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Transition to reconnecting state
        DispatchQueue.main.async {
            call.updateState(.reconnecting)
        }
    }
    
    func voiceClient(_ client: VGVoiceClient, didReceiveMediaReconnectionForCall callId: VGCallId) {
        print("✅ Media reconnected - Call: \(callId)")
        
        guard let call = context.activeCall, call.callId == callId else { return }
        
        // Transition back to active state
        DispatchQueue.main.async {
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
