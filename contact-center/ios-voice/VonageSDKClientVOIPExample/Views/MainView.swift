//
//  MainView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Copilot on 11/11/2025.
//

import SwiftUI

struct MainView: View {
    @EnvironmentObject private var coreContext: CoreContext
    @State private var usernameToCall: String = ""
    @State private var showDialer: Bool = false
    @State private var navigateToCall: Bool = false
    @State private var navigateToLogin: Bool = false
    
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
                Image(systemName: "dial.fill")
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
        .navigationDestination(isPresented: $navigateToLogin) {
            LoginView()
                .navigationBarBackButtonHidden(true)
        }
        .onReceive(coreContext.$activeCall) { call in
            if call != nil {
                navigateToCall = true
            } else {
                navigateToCall = false
            }
        }
        .onReceive(coreContext.clientManager.$sessionId) { sessionId in
            if sessionId == nil {
                navigateToLogin = true
            }
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
        if let displayName = coreContext.clientManager.currentUser?.displayName, !displayName.isEmpty {
            return displayName
        } else if let name = coreContext.clientManager.currentUser?.name {
            return name
        } else {
            return "Guest User"
        }
    }
    
    // MARK: - Actions
    private func callUser() {
        let trimmedUsername = usernameToCall.trimmingCharacters(in: .whitespacesAndNewlines)
        // Allow calling even with empty username - it's a valid use case
        coreContext.clientManager.startOutboundCall(to: trimmedUsername)
    }
    
    private func logout() {
        coreContext.clientManager.logout()
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
