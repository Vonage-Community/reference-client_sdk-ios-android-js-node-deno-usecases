//
//  LoginViewModel.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 15.05.23.
//

import Foundation
import Combine
import SwiftUI
import VonageClientSDKChat

class LoginViewModel: NSObject, ObservableObject {
    @Published var tokenOrCode: String = Configuration.defaultToken
    @Published var isSessionActive: Bool = false
    @Published var error: String = ""
    @Published var selectedLoginType: LoginType = .token
    var loginTypes = [LoginType.code, .token]
    private var cancelable = Set<AnyCancellable>()
    private var sessionId: String? = nil
    private var chatClient: VGChatClient {
        ChatClientManager.shared.chatClient
    }
    private var networkClient = NetworkClient()
    
    override init() {
        super.init()
        self.bindSessionDelegates()
    }
    
    func login() {
        switch selectedLoginType {
        case .code:
            loginWithCode()
        case .token:
            createSession(token: tokenOrCode)
        }
    }
    
    func onSignup() {
        // implements apis for device code
        // and then login with that code
    }
    
    private func loginWithCode() {
        networkClient
            .sendRequest(apiType: CodeLoginAPI(body: LoginRequest(code: tokenOrCode)))
            .receive(on: DispatchQueue.main)
            .sink { completion in
                switch completion {
                case .failure(let error):
                    self.error = error.localizedDescription
                default:
                    break
                }
            } receiveValue: { (user: TokenResponse) in
                self.tokenOrCode = ""
                self.createSession(token: user.vonageToken)
            }.store(in: &cancelable)
    }
    
    private func createSession(token: String) {
        chatClient.createSession(token) { error, sessionId in
            DispatchQueue.main.async {
                if let sessionId = sessionId {
                    self.sessionId = sessionId
                    self.isSessionActive = true
                    self.registerPushToken()
                } else if let error = error as? VGError {
                    self.error = error.message ?? Constants.Strings.unknownError.rawValue
                } else {
                    self.error = error?.localizedDescription ?? Constants.Strings.unknownError.rawValue
                }
            }
        }
    }
    
    private func registerPushToken() {
        PushManager.shared.$deviceToken
            .compactMap{ $0 }
            .sink { token in
                self.chatClient.registerDeviceToken(token, isSandbox: true) { error, _ in
                    DispatchQueue.main.async {
                        if let error = error as? VGError {
                            self.error = "failed to register for push \(error.message ?? "")"
                        } else if let error = error {
                            self.error = "failed to register for push \(error.localizedDescription)"
                        }
                    }
                }
            }.store(in: &cancelable)
    }
    
    func getChatsListsViewModel() -> ChatsListViewModel {
        ChatsListViewModel(client: chatClient)
    }
    
    func onLoginTypeChange(type: LoginType) {
        print("Selected login option: \(selectedLoginType.rawValue)")
        tokenOrCode = type == .token ? Configuration.defaultToken : ""
    }
}

extension LoginViewModel {
    private func bindSessionDelegates() {
        ChatClientManager
            .shared
            .sessionPublisher.receive(on: DispatchQueue.main)
            .sink { error in
                self.error = "Session failed because of reason \(error)"
            }.store(in: &cancelable)
    }
}
