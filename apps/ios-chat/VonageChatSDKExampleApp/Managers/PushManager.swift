//
//  PushManager.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 17.05.23.
//

import UserNotifications
import Combine
import UIKit

class PushManager: NSObject, UNUserNotificationCenterDelegate {
    static var shared: PushManager = .init()
    @Published private(set) var deviceToken: Data?
    @Published private(set) var pushPayload: [AnyHashable: Any]?
    @Published private(set) var silentPushPayload: [AnyHashable: Any]?
    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { isGranted, _ in
            if isGranted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        pushPayload = response.notification.request.content.userInfo
        completionHandler()
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        pushPayload = notification.request.content.userInfo
        completionHandler([.banner,.badge,.sound,.list])
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // for silentPush
        silentPushPayload = userInfo
        completionHandler(.newData)
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        self.deviceToken = deviceToken
        print("device Token: ", deviceToken.map( { String(format: "%02.2hhx", $0) }).joined())
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    }
}
