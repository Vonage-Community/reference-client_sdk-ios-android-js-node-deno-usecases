//
//  SocketDelegatesManager.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 23.05.23.
//

import Foundation
import Combine
import VonageClientSDKChat

class ChatClientManager:NSObject,  VGChatClientDelegate  {
    static let shared: ChatClientManager = .init()
    private var refreshToken: String = ""
    let chatClient: VGChatClient
    let eventPublisher: PassthroughSubject<VGConversationEvent, Never> = .init()
    let sessionPublisher: PassthroughSubject<VGSessionErrorReason, Never> = .init()
    var anyCancellable: AnyCancellable?
    
    private override init() {
        VGBaseClient.setDefaultLoggingLevel(.debug)
        chatClient = .init()
        super.init()
        chatClient.delegate = self
        chatClient.setConfig(.init(region: .US, andEnableWebsocketInvites: true))
    }
    
    func chatClient(_ client: VGChatClient, didReceiveConversationEvent event: VGConversationEvent) {
        eventPublisher.send(event)
    }
    
    func client(_ client: VGBaseClient, didReceiveSessionErrorWith reason: VGSessionErrorReason) {
        sessionPublisher.send(reason)
        if reason == .tokenExpired {
            sendRefreshTokenRequest()
        }
    }
    
    func setRefreshToken(_ token: String) {
        refreshToken = token
    }
    
    func sendRefreshTokenRequest() {
        anyCancellable = NetworkClient()
            .sendRequest(apiType: RefreshTokenAPI(refreshToken: refreshToken))
            .sink(receiveCompletion: { completion in
                if case .failure(let error) = completion {
                    print("received failure with \(error.localizedDescription)")
                    self.sessionPublisher.send(.tokenExpired)
                }
            }, receiveValue: { (response: TokenResponse) in
                self.chatClient.refreshSession(response.vonageToken) { error in
                    if let error = error {
                        print("received failure with \(error.localizedDescription)")
                        self.sessionPublisher.send(.tokenExpired)
                        return
                    }
                }
                self.refreshToken = response.refreshToken
            })
    }
}

struct RefreshTokenAPI: ApiType {
    var url: String = Configuration.getURLFor(key: .tokenRefreshUrl)
    var method: String = "POST"
    var body: Encodable?
    
    init(refreshToken: String) {
        body = RefreshTokenRequest(refreshToken: refreshToken)
    }
}
