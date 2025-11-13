//
//  MainView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI
import VonageClientSDKCore

struct MainView: View {
    @EnvironmentObject private var coreContext: CoreContext
    @State private var callInput: String = ""
    @State private var navigateToCall: Bool = false
    @State private var currentUser: VGUser?
    
    var body: some View {
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
                        
                        Text("Enter a username or phone number")
                            .font(AppTypography.bodyMedium)
                            .foregroundColor(.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, AppSpacing.extraLarge)
                    
                    Spacer()
                        .frame(height: AppSpacing.extraLarge)
                    
                    // Call Input
                    VStack(spacing: AppSpacing.medium) {
                        TextField("Username or phone number", text: $callInput)
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
                        Button(action: makeCall) {
                            HStack(spacing: AppSpacing.small) {
                                Image(systemName: "phone.fill")
                                    .font(.system(size: 18))
                                Text("Call")
                            }
                        }
                        .buttonStyle(PrimaryButtonStyle())
                    }
                    .padding(.horizontal, AppSpacing.extraLarge)
                    
                    Spacer()
                }
            }
            .background(Color.backgroundLight)
        }
        .navigationBarHidden(true)
        .navigationDestination(isPresented: $navigateToCall) {
            CallView()
                .navigationBarBackButtonHidden(true)
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
    private func makeCall() {
        let trimmedInput = callInput.trimmingCharacters(in: .whitespacesAndNewlines)
        coreContext.voiceClientManager.startOutboundCall(to: trimmedInput)
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
