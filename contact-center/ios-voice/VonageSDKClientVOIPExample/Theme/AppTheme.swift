//
//  AppTheme.swift
//  VonageSDKClientVOIPExample
//
//  Created by Copilot on 11/11/2025.
//

import SwiftUI

// MARK: - Color Palette
extension Color {
    // Primary colors matching Android Material Design 3
    static let primaryPurple = Color(red: 0.612, green: 0.153, blue: 0.690) // #9C27B0
    static let primaryPurple500 = Color(red: 0.612, green: 0.153, blue: 0.690)
    static let primaryPurple700 = Color(red: 0.482, green: 0.094, blue: 0.557) // #7B1FA2
    static let secondaryTeal = Color(red: 0.0, green: 0.737, blue: 0.831) // #00BCD4
    static let secondaryTeal200 = Color(red: 0.502, green: 0.918, blue: 0.945) // #80E8F1
    static let secondaryTeal700 = Color(red: 0.0, green: 0.592, blue: 0.663) // #0097A7
    
    // Semantic colors
    static let successGreen = Color(red: 0.298, green: 0.686, blue: 0.314) // #4CAF50
    static let errorRed = Color(red: 0.957, green: 0.263, blue: 0.212) // #F44336
    static let warningOrange = Color(red: 1.0, green: 0.596, blue: 0.0) // #FF9800
    
    // Neutral colors
    static let backgroundLight = Color(red: 0.980, green: 0.980, blue: 0.980) // #FAFAFA
    static let surfaceLight = Color.white
    static let textPrimary = Color(red: 0.129, green: 0.129, blue: 0.129) // #212121
    static let textSecondary = Color(red: 0.459, green: 0.459, blue: 0.459) // #757575
    static let divider = Color(red: 0.741, green: 0.741, blue: 0.741) // #BDBDBD
    
    // Call state colors
    static let callRinging = primaryPurple
    static let callActive = successGreen
    static let callDisconnected = errorRed
    static let callHold = Color.gray
}

// MARK: - Typography
struct AppTypography {
    // Display styles
    static let displayLarge = Font.system(size: 57, weight: .regular)
    static let displayMedium = Font.system(size: 45, weight: .regular)
    static let displaySmall = Font.system(size: 36, weight: .regular)
    
    // Headline styles
    static let headlineLarge = Font.system(size: 32, weight: .semibold)
    static let headlineMedium = Font.system(size: 28, weight: .semibold)
    static let headlineSmall = Font.system(size: 24, weight: .semibold)
    
    // Title styles
    static let titleLarge = Font.system(size: 22, weight: .medium)
    static let titleMedium = Font.system(size: 16, weight: .medium)
    static let titleSmall = Font.system(size: 14, weight: .medium)
    
    // Body styles
    static let bodyLarge = Font.system(size: 16, weight: .regular)
    static let bodyMedium = Font.system(size: 14, weight: .regular)
    static let bodySmall = Font.system(size: 12, weight: .regular)
    
    // Label styles
    static let labelLarge = Font.system(size: 14, weight: .medium)
    static let labelMedium = Font.system(size: 12, weight: .medium)
    static let labelSmall = Font.system(size: 11, weight: .medium)
}

// MARK: - Spacing
struct AppSpacing {
    static let extraSmall: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
    static let extraLarge: CGFloat = 32
    static let xxLarge: CGFloat = 48
}

// MARK: - Corner Radius
struct AppCornerRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let extraLarge: CGFloat = 24
    static let circular: CGFloat = 999
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    let isLoading: Bool
    
    init(isLoading: Bool = false) {
        self.isLoading = isLoading
    }
    
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .font(AppTypography.titleMedium)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                RoundedRectangle(cornerRadius: AppCornerRadius.medium)
                    .fill(isLoading ? Color.primaryPurple.opacity(0.6) : Color.primaryPurple)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .font(AppTypography.titleMedium)
            .foregroundColor(.primaryPurple)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                RoundedRectangle(cornerRadius: AppCornerRadius.medium)
                    .stroke(Color.primaryPurple, lineWidth: 1.5)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Card Style
struct CardModifier: ViewModifier {
    var cornerRadius: CGFloat = AppCornerRadius.medium
    var shadowRadius: CGFloat = 4
    
    func body(content: Content) -> some View {
        content
            .background(Color.surfaceLight)
            .cornerRadius(cornerRadius)
            .shadow(color: Color.black.opacity(0.08), radius: shadowRadius, x: 0, y: 2)
    }
}

extension View {
    func cardStyle(cornerRadius: CGFloat = AppCornerRadius.medium, shadowRadius: CGFloat = 4) -> some View {
        self.modifier(CardModifier(cornerRadius: cornerRadius, shadowRadius: shadowRadius))
    }
}

// MARK: - Gradient Backgrounds
struct GradientBackground {
    static func forCallState(_ state: CallState) -> LinearGradient {
        switch state {
        case .ringing:
            return LinearGradient(
                colors: [Color.primaryPurple500, Color.secondaryTeal200],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .active:
            return LinearGradient(
                colors: [Color.successGreen.opacity(0.8), Color.secondaryTeal700.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .holding:
            return LinearGradient(
                colors: [Color.callHold, Color.callHold.opacity(0.7)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .disconnected:
            return LinearGradient(
                colors: [Color.errorRed.opacity(0.7), Color.errorRed.opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .reconnecting:
            return LinearGradient(
                colors: [Color.primaryPurple700.opacity(0.7), Color.primaryPurple500.opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Call State Enum
enum CallState {
    case ringing
    case active
    case holding
    case disconnected
    case reconnecting
}
