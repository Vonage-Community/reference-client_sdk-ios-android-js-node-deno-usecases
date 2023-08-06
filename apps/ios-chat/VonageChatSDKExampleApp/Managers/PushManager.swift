//
//  PushManager.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 17.05.23.
//

import UserNotifications
import Combine
import UIKit
import PushKit

class PushManager: NSObject, UNUserNotificationCenterDelegate {
    static var shared: PushManager = .init()
    @Published private(set) var pushToken: Data?
    @Published private(set) var voipToken: Data?
    private let voipPushRegister: PKPushRegistry = .init(queue: nil)
    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { isGranted, _ in
            if isGranted {
                DispatchQueue.main.async {
                    self.voipPushRegister.delegate = self
                    self.voipPushRegister.desiredPushTypes = [.voIP]
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        //TODO: Handle Push
        completionHandler()
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        //TODO: Handle Push
        completionHandler([.banner,.badge,.sound,.list])
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        //TODO: Handle Push
        completionHandler(.newData)
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        pushToken = deviceToken
        print("device Token: ", deviceToken.map( { String(format: "%02.2hhx", $0) }).joined())
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    }
}

extension PushManager: PKPushRegistryDelegate {
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        if type == .voIP {
            self.voipToken = pushCredentials.token
            print("Voip Token: ", pushCredentials.token.map( { String(format: "%02.2hhx", $0) }).joined())

        }
    }
    
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) async {
        //TODO: Handle Push for Voip
    }
    
    
}
