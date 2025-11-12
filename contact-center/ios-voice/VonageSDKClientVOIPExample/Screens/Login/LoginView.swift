//
//  LoginView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @EnvironmentObject private var coreContext: CoreContext
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.backgroundLight
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: AppSpacing.large) {
                        Spacer()
                            .frame(height: AppSpacing.xxLarge)
                        
                        // Logo
                        Image(systemName: "phone.circle.fill")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 120, height: 120)
                            .foregroundColor(.primaryPurple)
                        
                        Spacer()
                            .frame(height: AppSpacing.xxLarge)
                        
                        // Welcome Text
                        VStack(spacing: AppSpacing.small) {
                            Text("Welcome")
                                .font(AppTypography.headlineMedium)
                                .foregroundColor(.textPrimary)
                            
                            Text("Sign in to continue")
                                .font(AppTypography.bodyLarge)
                                .foregroundColor(.textSecondary)
                        }
                        
                        Spacer()
                            .frame(height: AppSpacing.extraLarge)
                        
                        // Input Field
                        VStack(alignment: .leading, spacing: AppSpacing.small) {
                            TextField(
                                viewModel.loginWithToken ? "Token" : "Login Code",
                                text: viewModel.loginWithToken ? $viewModel.token : $viewModel.code
                            )
                            .font(AppTypography.bodyMedium)
                            .padding()
                            .background(Color.surfaceLight)
                            .cornerRadius(AppCornerRadius.medium)
                            .overlay(
                                RoundedRectangle(cornerRadius: AppCornerRadius.medium)
                                    .stroke(Color.divider, lineWidth: 1)
                            )
                            .disabled(viewModel.isLoading)
                            .autocapitalization(.none)
                            .autocorrectionDisabled()
                            
                            if viewModel.loginWithToken {
                                Text("Token will be used for authentication")
                                    .font(AppTypography.bodySmall)
                                    .foregroundColor(.textSecondary)
                                    .padding(.horizontal, AppSpacing.small)
                            }
                        }
                        
                        Spacer()
                            .frame(height: AppSpacing.large)
                        
                        // Login Button
                        Button(action: {
                            viewModel.performLogin()
                        }) {
                            HStack(spacing: AppSpacing.small) {
                                if viewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Login")
                                }
                            }
                        }
                        .buttonStyle(PrimaryButtonStyle(isLoading: viewModel.isLoading))
                        .disabled(viewModel.isLoading || viewModel.currentInput.isEmpty)
                        
                        Spacer()
                            .frame(height: AppSpacing.medium)
                        
                        // Token/Code Toggle
                        HStack(spacing: AppSpacing.small) {
                            Toggle("", isOn: $viewModel.loginWithToken)
                                .labelsHidden()
                                .tint(.primaryPurple)
                                .disabled(viewModel.isLoading)
                            
                            Text("Login with token")
                                .font(AppTypography.bodyMedium)
                                .foregroundColor(.textPrimary)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        
                        // Error Message
                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(AppTypography.bodySmall)
                                .foregroundColor(.errorRed)
                                .multilineTextAlignment(.center)
                                .padding(.top, AppSpacing.small)
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, AppSpacing.extraLarge)
                }
            }
        }
        .onAppear {
            viewModel.setup(with: coreContext.voiceClientManager)
        }
    }
}

// MARK: - Preview
struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(CoreContext.shared)
    }
}
