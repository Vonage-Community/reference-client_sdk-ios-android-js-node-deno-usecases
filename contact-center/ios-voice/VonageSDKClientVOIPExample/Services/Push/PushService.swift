//
//  PushService.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 12/02/2023.
//

import UIKit
import PushKit
import Combine
import UserNotifications

typealias PushToken = (user: Data, voip: Data)

/// Service responsible for managing push notifications (VoIP and user notifications)
/// Uses Combine to publish push events that other parts of the app can subscribe to
class PushService: NSObject {
    
    private let voipRegistry = PKPushRegistry(queue: nil)
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Published Push Events
    
    /// Publishes the PushKit (VoIP) token when registered
    let pushKitToken = CurrentValueSubject<Data?, Never>(nil)
    
    /// Publishes the user notification token when registered
    let notificationToken = CurrentValueSubject<Data?, Never>(nil)
    
    /// Publishes incoming VoIP push payloads with their completion handlers
    let voipPush = PassthroughSubject<(payload: PKPushPayload, completion: () -> Void), Never>()

    override init() {
        super.init()
    }
    
    // MARK: - Push Token Registration
    
    /// Initializes push notification registration for both user notifications and VoIP
    /// This should be called after the app is launched
    func initialisePushTokens() {
        // Subscribe to user notification token registration
        NotificationCenter.default
            .publisher(for: NSNotification.didRegisterForRemoteNotificationNotification)
            .compactMap { notification in notification.userInfo?["data"] as? Data }
            .first()
            .sink { [weak self] token in
                self?.notificationToken.send(token)
            }
            .store(in: &cancellables)
 
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, _ in
            guard let self, granted else { return }
            
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                
                // Register for user notifications
                UIApplication.shared.registerForRemoteNotifications()
                
                // Register for VoIP push notifications
                self.voipRegistry.delegate = self
                self.voipRegistry.desiredPushTypes = [.voIP]
            }
        }
    }
}

// MARK: - PKPushRegistryDelegate

extension PushService: PKPushRegistryDelegate {
    
    /// Called when VoIP push credentials are updated
    func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
        guard type == .voIP else { return }
        pushKitToken.send(pushCredentials.token)
    }
    
    /// Called when an incoming VoIP push is received
    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
        guard type == .voIP else {
            completion()
            return
        }
        
        // Pass completion along with payload - it will be called after CallKit reports the call
        voipPush.send((payload: payload, completion: completion))
    }
}
