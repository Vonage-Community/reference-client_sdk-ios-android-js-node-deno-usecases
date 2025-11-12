//
//  MainView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI
import VonageClientSDKVoice

struct MainView: View {
    @EnvironmentObject private var coreContext: CoreContext
    @State private var usernameToCall: String = ""
    @State private var showDialer: Bool = false
    @State private var navigateToCall: Bool = false
    @State private var currentUser: VGUser?
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                // Top Bar
                topBar
                
                // Main Content
                ScrollView {
                    VStack(spacing: AppSpacing.large) {
                        Spacer()
                            .frame(height: AppSpacing.xxLarge)
                        
                        // Title Section
                        VStack(spacing: AppSpacing.small) {
                            Text("Make a Call")
                                .font(AppTypography.headlineSmall)
                                .foregroundColor(.textPrimary)
                            
                            Text("Enter username to start a voice call")
                                .font(AppTypography.bodyMedium)
                                .foregroundColor(.textSecondary)
                                .multilineTextAlignment(.center)
                            
                            Text("or tap the dialer button to call a phone number")
                                .font(AppTypography.bodySmall)
                                .foregroundColor(.textSecondary.opacity(0.8))
                                .multilineTextAlignment(.center)
                        }
                        .padding(.horizontal, AppSpacing.extraLarge)
                        
                        Spacer()
                            .frame(height: AppSpacing.extraLarge)
                        
                        // Username Input
                        VStack(spacing: AppSpacing.medium) {
                            TextField("Username", text: $usernameToCall)
                                .font(AppTypography.bodyMedium)
                                .padding()
                                .background(Color.surfaceLight)
                                .cornerRadius(AppCornerRadius.medium)
                                .overlay(
                                    RoundedRectangle(cornerRadius: AppCornerRadius.medium)
                                        .stroke(Color.divider, lineWidth: 1)
                                )
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                            
                            // Call Button
                            Button(action: {
                                callUser()
                            }) {
                                Text("Call User")
                            }
                            .buttonStyle(PrimaryButtonStyle())
                        }
                        .padding(.horizontal, AppSpacing.extraLarge)
                        
                        Spacer()
                    }
                }
                .background(Color.backgroundLight)
            }
            
            // Floating Action Button (Dialer)
            Button(action: {
                showDialer = true
            }) {
                Image(systemName: "circle.grid.3x3.fill")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        Circle()
                            .fill(Color.primaryPurple)
                            .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                    )
            }
            .padding([.trailing, .bottom], AppSpacing.large)
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showDialer) {
            DialerView(dialerType: .phoneNumber)
        }
        .navigationDestination(isPresented: $navigateToCall) {
            if let activeCall = coreContext.activeCall {
                CallView(call: activeCall)
                    .navigationBarBackButtonHidden(true)
            }
        }
        .onReceive(coreContext.$activeCall) { call in
            navigateToCall = call != nil
        }
        .onReceive(coreContext.voiceClientManager.$currentUser) { user in
            currentUser = user
        }
    }
    
    // MARK: - Top Bar
    private var topBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Vonage Voice")
                    .font(AppTypography.titleLarge)
                    .foregroundColor(.white)
                
                Text(username)
                    .font(AppTypography.bodySmall)
                    .foregroundColor(.white.opacity(0.8))
            }
            
            Spacer()
            
            Button(action: {
                logout()
            }) {
                Text("Logout")
                    .font(AppTypography.labelLarge)
                    .foregroundColor(.white)
                    .padding(.horizontal, AppSpacing.medium)
                    .padding(.vertical, AppSpacing.small)
            }
        }
        .padding(.horizontal, AppSpacing.large)
        .padding(.vertical, AppSpacing.medium)
        .background(Color.primaryPurple)
    }
    
    // MARK: - Computed Properties
    private var username: String {
        guard let user = currentUser else {
            return "Guest User"
        }
        
        if let displayName = user.displayName, !displayName.isEmpty {
            return displayName
        }
        
        return user.name
    }
    
    // MARK: - Actions
    private func callUser() {
        let trimmedUsername = usernameToCall.trimmingCharacters(in: .whitespacesAndNewlines)
        // Allow calling even with empty username - it's a valid use case
        coreContext.voiceClientManager.startOutboundCall(to: trimmedUsername)
    }
    
    private func logout() {
        coreContext.voiceClientManager.logout()
    }
}

// MARK: - Preview
struct MainView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            MainView()
                .environmentObject(CoreContext.shared)
        }
    }
}
