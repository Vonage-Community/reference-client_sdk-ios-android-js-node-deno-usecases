//
//  DialerView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI
import AVFoundation

struct DialerView: View {
    @EnvironmentObject private var coreContext: CoreContext
    @Environment(\.dismiss) private var dismiss
    @State private var dialedDigits: String = ""
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Drag Handle
            Capsule()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 36, height: 5)
                .padding(.top, 12)
            
            // Header
            VStack(spacing: AppSpacing.small) {
                Text("Send DTMF")
                    .font(AppTypography.titleLarge)
                    .fontWeight(.semibold)
                    .foregroundColor(.textPrimary)
                
                Text("Enter digits to send during call")
                    .font(AppTypography.bodySmall)
                    .foregroundColor(.textSecondary)
            }
            .padding(.top, AppSpacing.large)
            
            // Display Field
            Text(dialedDigits.isEmpty ? "—" : dialedDigits)
                .font(.system(size: 48, weight: .light, design: .rounded))
                .foregroundColor(.textPrimary)
                .tracking(8)
                .frame(maxWidth: .infinity)
                .frame(height: 80)
                .padding(.horizontal, AppSpacing.large)
                .padding(.top, AppSpacing.large)
            
            Spacer()
                .frame(height: AppSpacing.extraLarge)
            
            // Dialpad
            dialpad
                .padding(.horizontal, AppSpacing.large)
            
            Spacer()
                .frame(height: AppSpacing.large)
            
            // Action Buttons
            HStack(spacing: AppSpacing.medium) {
                // Clear Button
                Button(action: clearDigits) {
                    HStack(spacing: AppSpacing.small) {
                        Image(systemName: "xmark")
                        Text("Clear")
                    }
                }
                .buttonStyle(SecondaryButtonStyle())
                .disabled(dialedDigits.isEmpty)
                
                // Done Button
                Button(action: { dismiss() }) {
                    Text("Done")
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding(.horizontal, AppSpacing.large)
            
            Spacer()
                .frame(height: AppSpacing.large)
        }
        .background(Color.surfaceLight)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }
    
    // MARK: - Dialpad
    private var dialpad: some View {
        VStack(spacing: 16) {
            dialpadRow(["1", "2", "3"])
            dialpadRow(["4", "5", "6"])
            dialpadRow(["7", "8", "9"])
            dialpadRow(["*", "0", "#"])
        }
    }
    
    private func dialpadRow(_ digits: [String]) -> some View {
        HStack(spacing: 16) {
            ForEach(digits, id: \.self) { digit in
                dialpadButton(digit)
            }
        }
    }
    
    private func dialpadButton(_ digit: String) -> some View {
        Button {
            handleDialpadTap(digit)
        } label: {
            Text(digit)
                .font(.system(size: 36, weight: .regular, design: .rounded))
                .foregroundColor(.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 72)
                .background(
                    Circle()
                        .fill(Color.backgroundLight)
                        .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
                )
                .contentShape(Circle())
        }
        .buttonStyle(DialpadButtonStyle())
    }
    
    // MARK: - Actions
    private func handleDialpadTap(_ digit: String) {
        // Add digit to display
        dialedDigits.append(digit)
        
        // Play DTMF tone for immediate feedback
        playDTMFTone(for: digit)
        
        // Send DTMF to active call
        guard let activeCall = coreContext.activeCall else { return }
        coreContext.voiceClientManager.sendDTMF(activeCall, digit: digit)
    }
    
    private func clearDigits() {
        dialedDigits = ""
    }
    
    private func playDTMFTone(for digit: String) {
        let toneMap: [String: SystemSoundID] = [
            "0": 1200, "1": 1201, "2": 1202, "3": 1203,
            "4": 1204, "5": 1205, "6": 1206, "7": 1207,
            "8": 1208, "9": 1209, "*": 1210, "#": 1211
        ]
        
        guard let soundId = toneMap[digit] else { return }
        AudioServicesPlaySystemSound(soundId)
    }
}

// MARK: - Dialpad Button Style
private struct DialpadButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .opacity(configuration.isPressed ? 0.7 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Preview
struct DialerView_Previews: PreviewProvider {
    static var previews: some View {
        DialerView()
            .environmentObject(CoreContext.shared)
    }
}
