//
//  CallClient+PushKitDelegate.swift
//  Runner
//
//  Created by Nathan Tamez on 21/12/2023.
//

import PushKit
import CallKit
import Foundation
import UserNotifications
import VonageClientSDKVoice
import flutter_callkit_incoming

extension CallClient: PKPushRegistryDelegate, UNUserNotificationCenterDelegate {
    func registerForVoIPPushes() {
        voipRegistry.delegate = self
        voipRegistry.desiredPushTypes = [PKPushType.voIP]
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if (type == .voIP) {
            preferences.voipToken = pushCredentials.token
        }
    }
    func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
        preferences.voipToken = nil
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
        let vonagePushType = VGVoiceClient.vonagePushType(payload.dictionaryPayload);
        switch vonagePushType {
        case .incomingCall:
            let lastPushCallInvite = client.processCallInvitePushData(payload.dictionaryPayload)
            var callData = [String: Any?]()
            callData["id"] = lastPushCallInvite
            callData["nameCaller"] = "Vonage"
            callData["type"] = 0
            callData["ios"] = [
                "supportsVideo": false,
                "supportsGrouping": false,
                "supportsUngrouping": false,
                "supportsHolding": true,
                "handleType": "generic"
            ]
            SwiftFlutterCallkitIncomingPlugin.sharedInstance?.showCallkitIncoming(flutter_callkit_incoming.Data(args: callData), fromPushKit: true)
            completion()
            break
        default:
            break
        }
    }
}
