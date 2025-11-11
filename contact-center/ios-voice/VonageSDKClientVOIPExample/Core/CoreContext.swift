//
//  CoreContext.swift
//  VonageSDKClientVOIPExample
//
//  Created by Copilot on 11/11/2025.
//

import Foundation
import Combine
import VonageClientSDKVoice

/// Core application context holding shared state and managers
/// This is the single source of truth for app-wide state
class CoreContext: ObservableObject {
    // Singleton instance
    static let shared = CoreContext()
    
    // Managers
    let clientManager: VoiceClientManager
    let pushController: PushController
    
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
        // Initialize Vonage Client with configuration
        let config = VGClientInitConfig(loggingLevel: .debug, region: .US)
        
        #if targetEnvironment(simulator)
        // On simulator: disable CallKit and enable WebSocket invites
        config.enableWebsocketInvites = true
        print("🖥️ Running on simulator - WebSocket invites enabled, CallKit disabled")
        #else
        // On device: use CallKit for native call UI
        print("📱 Running on device - CallKit enabled")
        #endif
        
        let vonageClient = VGVoiceClient(config)
        
        #if targetEnvironment(simulator)
        VGVoiceClient.isUsingCallKit = false
        #else
        VGVoiceClient.isUsingCallKit = true
        #endif
        
        // Initialize push controller first (no dependencies)
        self.pushController = PushController()
        
        // Initialize client manager without context (will be set below)
        self.clientManager = VoiceClientManager(client: vonageClient, context: nil)
        
        // Now set the context reference after all properties are initialized
        self.clientManager.setContext(self)
        
        // Bind push controller
        bindPushController()
        
        // Setup audio session
        setupAudioSession()
    }
    
    private func bindPushController() {
        // Initialize push tokens
        pushController.initialisePushTokens()
        
        // Handle VOIP push notifications
        pushController.voipPush
            .sink { [weak self] payload in
                self?.clientManager.processVoipPush(payload)
            }
            .store(in: &cancellables)
        
        // Store push kit token
        pushController.pushKitToken
            .compactMap { $0?.hexString }
            .sink { [weak self] token in
                self?.pushToken = token
            }
            .store(in: &cancellables)
        
        // Register device tokens when both tokens are available and user is logged in
        Publishers.CombineLatest3(
            pushController.pushKitToken.compactMap { $0?.hexString },
            pushController.notificationToken.compactMap { $0?.hexString },
            clientManager.$sessionId.compactMap { $0 }
        )
        .sink { [weak self] voipToken, userToken, _ in
            self?.clientManager.registerPushTokens(voip: voipToken, user: userToken)
        }
        .store(in: &cancellables)
    }
    
    private func setupAudioSession() {
        // Request microphone permission
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
        
        // Configure audio session
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .voiceChat, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ Failed to configure audio session: \(error)")
        }
    }
}

// MARK: - Call Wrapper
/// Wrapper around Vonage call to provide convenient state management
class VGCallWrapper: ObservableObject, Identifiable {
    let id: UUID
    let callId: String
    let callerDisplayName: String
    let isInbound: Bool
    
    @Published var state: CallState = .ringing
    @Published var isMuted: Bool = false
    @Published var isOnHold: Bool = false
    @Published var isNoiseSuppressionEnabled: Bool = false
    
    init(id: UUID, callId: String, callerDisplayName: String, isInbound: Bool) {
        self.id = id
        self.callId = callId
        self.callerDisplayName = callerDisplayName
        self.isInbound = isInbound
    }
    
    func updateState(_ newState: CallState) {
        DispatchQueue.main.async {
            self.state = newState
        }
    }
    
    func toggleMute() {
        DispatchQueue.main.async {
            self.isMuted.toggle()
        }
    }
    
    func toggleHold() {
        DispatchQueue.main.async {
            self.isOnHold.toggle()
        }
    }
    
    func toggleNoiseSuppression() {
        DispatchQueue.main.async {
            self.isNoiseSuppressionEnabled.toggle()
        }
    }
}

// MARK: - Data Extension
extension Data {
    var hexString: String {
        return map { String(format: "%02.2hhx", $0) }.joined()
    }
}
