//
//  AppDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//  Refactored for SwiftUI by Salvatore Di Cara on 11/11/2025.
//

import UIKit
import AVFoundation

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var coreContext: CoreContext?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        requestMicrophonePermission()
        
        return true
    }
    
    private func requestMicrophonePermission() {
        let authorizationStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        
        switch authorizationStatus {
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                print("🎤 Microphone access \(granted ? "granted" : "denied")")
            }
        case .authorized:
            print("🎤 Microphone access already granted")
        case .denied, .restricted:
            print("🎤 Microphone access denied or restricted")
        @unknown default:
            break
        }
    }
    
    // MARK: Notifications
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(
            name: NSNotification.didRegisterForRemoteNotificationNotification,
            object: nil,
            userInfo: ["data": deviceToken]
        )
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: NSNotification.didFailToRegisterForRemoteNotification,
            object: nil,
            userInfo: ["error": error]
        )
    }
}


// MARK: - Notification Names
extension NSNotification {
    public static let didRegisterForRemoteNotificationNotification = NSNotification.Name("didRegisterForRemoteNotificationWithDeviceTokenNotification")
    public static let didFailToRegisterForRemoteNotification = NSNotification.Name("didFailToRegisterForRemoteNotificationsWithErrorNotification")
}
