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
        // Setup microphone permissions and audio session early
        // This is critical for handling VoIP calls when app is not running
        requestMicrophonePermission()
        setupAudioSession()
        
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
    
    private func setupAudioSession() {
        #if targetEnvironment(simulator)
        // SIMULATOR ONLY — no CallKit, so we must configure audio manually
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord,
                                                            mode: .voiceChat,
                                                            options: [])
            try AVAudioSession.sharedInstance().setActive(true)
            print("🎧 Simulator audio session configured")
        } catch {
            print("❌ Simulator audio session setup failed: \(error)")
        }
        #else
        // REAL DEVICE — CallKit MUST handle all audio session configuration
        print("📱 Real device: skipping audio session setup (CallKit will handle it)")
        #endif
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
