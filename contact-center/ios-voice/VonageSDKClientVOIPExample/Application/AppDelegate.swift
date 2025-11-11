//
//  AppDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//  Refactored for SwiftUI by Copilot on 11/11/2025.
//

import UIKit
import VonageClientSDKVoice
import CallKit
import Combine
import AVFoundation

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var coreContext: CoreContext?
    private var cancellables = Set<AnyCancellable>()
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Core context is now managed by the SwiftUI App
        // Just ensure we have microphone permissions
        requestMicrophonePermission()
        
        return true
    }
    
    private func requestMicrophonePermission() {
        let mediaType = AVMediaType.audio
        let authorizationStatus = AVCaptureDevice.authorizationStatus(for: mediaType)
        
        switch authorizationStatus {
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: mediaType) { granted in
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
    
    func applicationWillTerminate(_ application: UIApplication) {
        // Logout on app termination
        coreContext?.clientManager.logout()
    }
}


// MARK: - Notification Names
extension NSNotification {
    public static let didRegisterForRemoteNotificationNotification = NSNotification.Name("didRegisterForRemoteNotificationWithDeviceTokenNotification")
    public static let didFailToRegisterForRemoteNotification = NSNotification.Name("didFailToRegisterForRemoteNotificationsWithErrorNotification")
}
