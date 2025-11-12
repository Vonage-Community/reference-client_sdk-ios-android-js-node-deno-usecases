//
//  CoreContext.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Combine
import Foundation

/// Core application context holding shared state and services
/// This is the single source of truth for app-wide state
/// All services are accessed through this singleton to maintain clear architecture
class CoreContext: ObservableObject {
    // MARK: - Singleton
    static let shared = CoreContext()

    // MARK: - Services
    let networkService: NetworkService
    let voiceClientManager: VoiceClientManager
    let pushService: PushService

    // MARK: - Shared state
    @Published var activeCall: VGCallWrapper? {
        didSet {
            // Persist call metadata for restoration
            PrivatePreferences.set(PrivatePreferences.CALL_ID, activeCall?.callId)
            PrivatePreferences.set(PrivatePreferences.CALLER_DISPLAY_NAME, activeCall?.callerDisplayName)
        }
    }

    // Last active call (computed from persisted metadata; not directly settable)
    var lastActiveCall: VGCallWrapper? {
        guard let callId = PrivatePreferences.get(PrivatePreferences.CALL_ID),
              let uuid = UUID(uuidString: callId) else { return nil }
        let displayName = PrivatePreferences.get(PrivatePreferences.CALLER_DISPLAY_NAME) ?? "Unknown"
        return VGCallWrapper(id: uuid, callId: callId, callerDisplayName: displayName, isInbound: true)
    }

    // Configuration (persisted via PrivatePreferences getters/setters)
    var authToken: String? {
        get { PrivatePreferences.get(PrivatePreferences.AUTH_TOKEN) }
        set { PrivatePreferences.set(PrivatePreferences.AUTH_TOKEN, newValue) }
    }
    var refreshToken: String? {
        get { PrivatePreferences.get(PrivatePreferences.REFRESH_TOKEN) }
        set { PrivatePreferences.set(PrivatePreferences.REFRESH_TOKEN, newValue) }
    }
    var deviceId: String? {
        get { PrivatePreferences.get(PrivatePreferences.DEVICE_ID) }
        set { PrivatePreferences.set(PrivatePreferences.DEVICE_ID, newValue) }
    }
    var pushToken: String? {
        get { PrivatePreferences.get(PrivatePreferences.PUSH_TOKEN) }
        set { PrivatePreferences.set(PrivatePreferences.PUSH_TOKEN, newValue) }
    }

    private var cancellables = Set<AnyCancellable>()

    private init() {
        // Initialize services (no interdependencies)
        networkService = NetworkService()
        pushService = PushService()
        voiceClientManager = VoiceClientManager()
        voiceClientManager.context = self
        bindPushService()
    }

    private func bindPushService() {
        // Initialize push tokens
        pushService.initialisePushTokens()

        // Handle VOIP push notifications
        pushService.voipPush
            .sink { [weak self] payload in
                self?.voiceClientManager.processVoipPush(payload)
            }
            .store(in: &cancellables)

        // Store push kit token
        pushService.pushKitToken
            .compactMap { $0?.hexString }
            .sink { [weak self] token in
                self?.pushToken = token
            }
            .store(in: &cancellables)

        // Register device tokens when both tokens are available and user is logged in
        Publishers.CombineLatest3(
            pushService.pushKitToken.compactMap { $0?.hexString },
            pushService.notificationToken.compactMap { $0?.hexString },
            voiceClientManager.$sessionId.compactMap { $0 }
        )
        .sink { [weak self] voipToken, userToken, _ in
            self?.voiceClientManager.registerPushTokens(voip: voipToken, user: userToken)
        }
        .store(in: &cancellables)
    }
}
