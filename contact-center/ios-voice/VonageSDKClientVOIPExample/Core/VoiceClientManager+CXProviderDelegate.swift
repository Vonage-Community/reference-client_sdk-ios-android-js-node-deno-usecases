//
//  VoiceClientManager+CXProviderDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Foundation
import CallKit
import AVFoundation
import VonageClientSDKVoice

// MARK: - CXProviderDelegate (Device only)
#if !targetEnvironment(simulator)
extension VoiceClientManager: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        print("📞 CallKit provider reset")
    }
    
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        guard let call = context.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        client.answer(call.callId) { [weak self] error in
            if let error {
                // Report failure to CallKit
                provider.reportCall(with: action.callUUID, endedAt: Date.now, reason: .failed)
                self?.endCall(call, reason: .failed)
                action.fail()
                return
            }
            
            print("✅ Answered call: \(call.callId)")
            
            // Update state to active - delegate is only called for remote leg
            Task { @MainActor in
                call.updateState(.active)
            }
            
            action.fulfill()
        }
    }
    
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard let call = context.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        if call.isInbound && call.state == .ringing {
            client.reject(call.callId) { error in
                action.fulfill()
            }
        } else {
            client.hangup(call.callId) { error in
                action.fulfill()
            }
        }
    }
    
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        guard let call = context.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        // Outbound call already started in startOutboundCall
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        guard let call = context.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        // Execute mute/unmute asynchronously but fulfill action synchronously
        // CallKit requires the action to be fulfilled immediately
        if action.isMuted {
            muteCall(call)
        } else {
            unmuteCall(call)
        }
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        guard let call = context.activeCall, call.id == action.callUUID else {
            action.fail()
            return
        }
        
        // Execute hold/unhold asynchronously but fulfill action synchronously
        // CallKit requires the action to be fulfilled immediately
        if action.isOnHold {
            holdCall(call)
        } else {
            unholdCall(call)
        }
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        print("🔊 CallKit activated audio session")
        VGVoiceClient.enableAudio(audioSession)
    }
    
    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        print("🔇 CallKit deactivated audio session")
        VGVoiceClient.disableAudio(audioSession)
    }
}
#endif
