//
//  VGCallWrapper.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Foundation

/// Wrapper around Vonage call to provide convenient state management
/// This class is ObservableObject to allow SwiftUI views to reactively update
@MainActor
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
    
    deinit {
        print("🗑️ VGCallWrapper deallocated for call: \(callId)")
    }
    
    func updateState(_ newState: CallState) {
        state = newState
    }
    
    func toggleMute() {
        isMuted.toggle()
    }
    
    func toggleHold() {
        isOnHold.toggle()
    }
    
    func toggleNoiseSuppression() {
        isNoiseSuppressionEnabled.toggle()
    }
}
