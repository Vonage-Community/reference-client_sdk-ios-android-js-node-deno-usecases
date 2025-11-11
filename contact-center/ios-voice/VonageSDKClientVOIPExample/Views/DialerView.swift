//
//  DialerView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Copilot on 11/11/2025.
//

import SwiftUI
import AVFoundation

enum DialerType {
    case phoneNumber
    case dtmf
}

struct DialerView: View {
    let dialerType: DialerType
    @EnvironmentObject private var coreContext: CoreContext
    @Environment(\.dismiss) private var dismiss
    @State private var dialedNumber: String = ""
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Drag Handle
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.gray.opacity(0.4))
                .frame(width: 32, height: 4)
                .padding(.top, AppSpacing.small)
            
            Spacer()
                .frame(height: AppSpacing.large)
            
            // Title
            Text(dialerType == .phoneNumber ? "Dial Number" : "Send DTMF")
                .font(AppTypography.titleLarge)
                .fontWeight(.semibold)
                .foregroundColor(.textPrimary)
            
            Spacer()
                .frame(height: AppSpacing.large)
            
            // Number Input Field
            TextField(dialerType == .phoneNumber ? "Enter number" : "Enter digits", text: $dialedNumber)
                .font(AppTypography.headlineMedium)
                .foregroundColor(.textPrimary)
                .tracking(2)
                .multilineTextAlignment(.center)
                .keyboardType(dialerType == .phoneNumber ? .phonePad : .numberPad)
                .focused($isTextFieldFocused)
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(Color.backgroundLight)
                .cornerRadius(AppCornerRadius.large)
                .padding(.horizontal, AppSpacing.large)
                .onChange(of: dialedNumber) { newValue in
                    // For DTMF mode, send each new digit as it's typed
                    if dialerType == .dtmf, let activeCall = coreContext.activeCall {
                        // Check if a new digit was added by comparing lengths
                        if !newValue.isEmpty {
                            let newDigit = String(newValue.last!)
                            if isValidDTMFDigit(newDigit) {
                                coreContext.clientManager.sendDTMF(activeCall, digit: newDigit)
                                playDTMFTone(for: newDigit)
                            }
                        }
                    }
                }
                .onAppear {
                    // Auto-focus the text field when the view appears
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        isTextFieldFocused = true
                    }
                }
            
            Spacer()
                .frame(height: AppSpacing.large)
            
            // Optional: Show dialpad for DTMF mode
            if dialerType == .dtmf {
                dialpad
            } else {
                // Add some spacing for phone number mode
                Spacer()
            }
            
            Spacer()
                .frame(height: AppSpacing.large)
            
            // Action Buttons
            if dialerType == .phoneNumber {
                Button(action: {
                    makeCall()
                }) {
                    HStack(spacing: AppSpacing.small) {
                        Image(systemName: "phone.fill")
                            .font(.system(size: 20))
                        Text("Call")
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, AppSpacing.large)
            } else {
                Button(action: {
                    dismiss()
                }) {
                    Text("Done")
                }
                .buttonStyle(SecondaryButtonStyle())
                .padding(.horizontal, AppSpacing.large)
            }
            
            Spacer()
                .frame(height: AppSpacing.large)
        }
        .background(Color.surfaceLight)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }
    
    // MARK: - Dialpad
    private var dialpad: some View {
        VStack(spacing: AppSpacing.medium) {
            dialpadRow(["1", "2", "3"])
            dialpadRow(["4", "5", "6"])
            dialpadRow(["7", "8", "9"])
            dialpadRow(["*", "0", "#"])
        }
        .padding(.horizontal, AppSpacing.large)
    }
    
    private func dialpadRow(_ digits: [String]) -> some View {
        HStack(spacing: AppSpacing.medium) {
            ForEach(digits, id: \.self) { digit in
                dialpadButton(digit)
            }
        }
    }
    
    private func dialpadButton(_ digit: String) -> some View {
        Button(action: {
            handleDialpadTap(digit)
        }) {
            Text(digit)
                .font(.system(size: 32, weight: .medium))
                .foregroundColor(.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .background(
                    Circle()
                        .fill(Color.backgroundLight)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Actions
    private func handleDialpadTap(_ digit: String) {
        dialedNumber.append(digit)
        
        // Play DTMF tone
        playDTMFTone(for: digit)
        
        // Send DTMF if in DTMF mode
        if dialerType == .dtmf, let activeCall = coreContext.activeCall {
            coreContext.clientManager.sendDTMF(activeCall, digit: digit)
        }
    }
    
    private func makeCall() {
        // Allow calling even with empty number - it's a valid use case
        isTextFieldFocused = false // Dismiss keyboard
        
        coreContext.clientManager.startOutboundCall(
            to: dialedNumber,
            context: ["call_type": "phone"]
        )
        
        dismiss()
    }
    
    private func isValidDTMFDigit(_ digit: String) -> Bool {
        return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#"].contains(digit)
    }
    
    private func playDTMFTone(for digit: String) {
        let toneMap: [String: SystemSoundID] = [
            "0": 1200,
            "1": 1201,
            "2": 1202,
            "3": 1203,
            "4": 1204,
            "5": 1205,
            "6": 1206,
            "7": 1207,
            "8": 1208,
            "9": 1209,
            "*": 1210,
            "#": 1211
        ]
        
        if let soundId = toneMap[digit] {
            AudioServicesPlaySystemSound(soundId)
        }
    }
}

// MARK: - Preview
struct DialerView_Previews: PreviewProvider {
    static var previews: some View {
        DialerView(dialerType: .phoneNumber)
            .environmentObject(CoreContext.shared)
    }
}
