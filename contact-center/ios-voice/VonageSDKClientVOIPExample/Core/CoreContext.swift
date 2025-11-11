//
//  CoreContext.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Combine

/// Core application context holding shared state and services
/// This is the single source of truth for app-wide state
/// All services are accessed through this singleton to maintain clear architecture
class CoreContext: ObservableObject {
    // Singleton instance
    static let shared = CoreContext()
    
    // MARK: - Services
    let networkService: NetworkService
    let voiceClientManager: VoiceClientManager
    let pushService: PushService
    
    // Shared state
    @Published var activeCall: VGCallWrapper?
    @Published var lastActiveCall: VGCallWrapper?
    
    // Configuration
    @Published var authToken: String?
    @Published var refreshToken: String?
    @Published var deviceId: String?
    @Published var pushToken: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        // Initialize services (no interdependencies)
        self.networkService = NetworkService()
        self.pushService = PushService()
        self.voiceClientManager = VoiceClientManager()
        
        // Now set the context reference after all properties are initialized
        self.voiceClientManager.context = self
        
        // Bind push service
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
