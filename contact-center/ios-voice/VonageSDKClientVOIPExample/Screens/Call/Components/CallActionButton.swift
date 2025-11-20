//
//  CallActionButton.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI

/// Reusable circular action button for call controls
/// Provides visual feedback on press with subtle animation
struct CallActionButton: View {
    let icon: String
    let color: Color
    var iconColor: Color = .white
    var size: CGFloat = 64
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .medium))
                .foregroundColor(iconColor)
                .frame(width: size, height: size)
                .background(
                    Circle()
                        .fill(color)
                        .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                )
                .contentShape(Circle())
        }
        .buttonStyle(CallActionButtonStyle())
    }
}

/// Custom button style for call action buttons with proper press animation
private struct CallActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
