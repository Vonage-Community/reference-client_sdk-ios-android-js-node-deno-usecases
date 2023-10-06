//
//  PushController+PKPushRegistryDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 12/02/2023.
//

import Foundation
import PushKit

extension PushController: PKPushRegistryDelegate {
        
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if (type == PKPushType.voIP) {
            pushKitToken.send(pushCredentials.token)
        }
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
            
        switch (type){
        case .voIP:
            newVoipPush.send(payload)
        default:
            return
        }
        completion()
    }
    
}
