//
//  CallView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI

struct CallView: View {
    @ObservedObject var call: VGCallWrapper
    @EnvironmentObject private var coreContext: CoreContext
    @Environment(\.dismiss) private var dismiss
    @State private var showDialer: Bool = false
    
    var body: some View {
        ZStack {
            // Gradient Background
            GradientBackground.forCallState(call.state)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 60)
                
                // User Info Section
                VStack(spacing: AppSpacing.large) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.25))
                            .frame(width: 100, height: 100)
                        
                        Image(systemName: "person.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.white)
                    }
                    
                    // Username
                    Text(call.callerDisplayName)
                        .font(AppTypography.headlineMedium)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    
                    // Call State Badge
                    callStateBadge
                }
                .padding(.top, AppSpacing.extraLarge)
                
                Spacer()
                
                // Controls Section
                if call.isInbound && call.state == .ringing {
                    incomingCallControls
                } else {
                    activeCallControls
                }
                
                Spacer()
                    .frame(height: AppSpacing.xxLarge)
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showDialer) {
            DialerView(dialerType: .dtmf)
        }
        .onReceive(coreContext.$activeCall) { activeCall in
            guard activeCall == nil else { return }
            // Delay dismiss to show disconnected state
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                dismiss()
            }
        }
    }
    
    // MARK: - Call State Badge
    private var callStateBadge: some View {
        Text(callStateText)
            .font(AppTypography.bodyLarge)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .padding(.horizontal, AppSpacing.medium)
            .padding(.vertical, AppSpacing.small)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.2))
            )
    }
    
    private var callStateText: String {
        switch call.state {
        case .ringing:
            return call.isInbound ? "Incoming Call..." : "Ringing..."
        case .active:
            return call.isOnHold ? "On Hold" : "Active"
        case .holding:
            return "On Hold"
        case .disconnected:
            return "Call Ended"
        case .reconnecting:
            return "Reconnecting..."
        }
    }
    
    // MARK: - Incoming Call Controls
    private var incomingCallControls: some View {
        HStack(spacing: AppSpacing.xxLarge) {
            // Reject Button
            CallActionButton(
                icon: "phone.down.fill",
                color: .errorRed,
                size: 68
            ) {
                coreContext.voiceClientManager.rejectCall(call)
            }
            
            // Answer Button
            CallActionButton(
                icon: "phone.fill",
                color: .successGreen,
                size: 68
            ) {
                coreContext.voiceClientManager.answerCall(call)
            }
        }
        .padding(.bottom, AppSpacing.large)
    }
    
    // MARK: - Active Call Controls
    private var activeCallControls: some View {
        VStack(spacing: AppSpacing.medium) {
            // First Row - Main Controls
            HStack(spacing: AppSpacing.medium) {
                // Mute Button
                CallActionButton(
                    icon: call.isMuted ? "mic.slash.fill" : "mic.fill",
                    color: call.isMuted ? .white : .white.opacity(0.3),
                    iconColor: call.isMuted ? .errorRed : .white
                ) {
                    toggleMute()
                }
                
                // Hold Button
                CallActionButton(
                    icon: call.isOnHold ? "play.fill" : "pause.fill",
                    color: call.isOnHold ? .white : .white.opacity(0.3),
                    iconColor: call.isOnHold ? .blue : .white
                ) {
                    toggleHold()
                }
                
                // Dialpad Button
                CallActionButton(
                    icon: "circle.grid.3x3.fill",
                    color: .white.opacity(0.3)
                ) {
                    showDialer = true
                }
            }
            
            // Second Row - Secondary Controls
            HStack(spacing: AppSpacing.medium) {
                // Noise Suppression Button
                CallActionButton(
                    icon: "waveform",
                    color: call.isNoiseSuppressionEnabled ? .white : .white.opacity(0.3),
                    iconColor: call.isNoiseSuppressionEnabled ? .primaryPurple : .white
                ) {
                    toggleNoiseSuppression()
                }
                
                // Hangup Button (Prominent)
                CallActionButton(
                    icon: "phone.down.fill",
                    color: .errorRed,
                    size: 64
                ) {
                    coreContext.voiceClientManager.hangupCall(call)
                }
                
                // Spacer for balance
                Color.clear
                    .frame(width: 64, height: 64)
            }
        }
        .padding(.bottom, AppSpacing.large)
    }
    
    // MARK: - Actions
    private func toggleMute() {
        if call.isMuted {
            coreContext.voiceClientManager.unmuteCall(call)
        } else {
            coreContext.voiceClientManager.muteCall(call)
        }
    }
    
    private func toggleHold() {
        if call.isOnHold {
            coreContext.voiceClientManager.unholdCall(call)
        } else {
            coreContext.voiceClientManager.holdCall(call)
        }
    }
    
    private func toggleNoiseSuppression() {
        if call.isNoiseSuppressionEnabled {
            coreContext.voiceClientManager.disableNoiseSuppression(call)
        } else {
            coreContext.voiceClientManager.enableNoiseSuppression(call)
        }
    }
}

// MARK: - Preview
struct CallView_Previews: PreviewProvider {
    static var previews: some View {
        let call = VGCallWrapper(
            id: UUID(),
            callId: "test-call-id",
            callerDisplayName: "John Doe",
            isInbound: true
        )
        
        return NavigationStack {
            CallView(call: call)
                .environmentObject(CoreContext.shared)
        }
    }
}
