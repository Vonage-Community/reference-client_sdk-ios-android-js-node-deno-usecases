//
//  LoginViewModel.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Foundation

/// ViewModel for the Login screen
/// Manages authentication state and coordinates with VoiceClientManager
class LoginViewModel: ObservableObject {
    @Published var token: String = ""
    @Published var code: String = ""
    @Published var loginWithToken: Bool = true
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    private weak var clientManager: VoiceClientManager?
    
    /// Returns the current input based on login mode
    var currentInput: String {
        loginWithToken ? token : code
    }
    
    init() {
        // Set default token from configuration
        let defaultToken = Configuration.defaultToken
        if !defaultToken.isEmpty {
            self.token = defaultToken
        }
    }
    
    /// Sets up the view model with a reference to the client manager
    /// - Parameter manager: The VoiceClientManager to use for authentication
    func setup(with manager: VoiceClientManager) {
        clientManager = manager
    }
    
    /// Performs login using either token or code based on current mode
    func performLogin() {
        guard let clientManager else {
            errorMessage = "Client manager not initialized"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        let onError: (Error) -> Void = { [weak self] error in
            DispatchQueue.main.async {
                self?.isLoading = false
                self?.errorMessage = "Login failed: \(error.localizedDescription)"
            }
        }
        
        let onSuccess: (String) -> Void = { [weak self] sessionId in
            DispatchQueue.main.async {
                self?.isLoading = false
                print("✅ Logged in successfully with session ID: \(sessionId)")
            }
        }
        
        if loginWithToken {
            clientManager.login(token: token, onError: onError, onSuccess: onSuccess)
        } else {
            clientManager.loginWithCode(code: code, onError: onError, onSuccess: onSuccess)
        }
    }
}
