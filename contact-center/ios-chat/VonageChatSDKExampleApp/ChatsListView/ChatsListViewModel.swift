//
//  ChatsListViewModel.swift
//  TestApp
//
//  Created by Mehboob Alam on 14.04.23.
//

import Combine
import VonageClientSDKChat

enum AlertType: Hashable, Identifiable {
    var id: AlertType {
        return self
    }
    case error(String?), invite(name: String), joined, logout, conversation(sender: String, text: String)
}


class ChatsListViewModel: NSObject,ObservableObject {
    private let vgClient: VGChatClient
    private var myUser: VGUser?
    private var conversation: VGConversation?
    private var cancellable: Set<AnyCancellable> = .init()
    private var cursor: String? = nil
    @Published var alertType: AlertType?
    @Published var conversations: [VGConversation] = []
    @Published var isMemberInvited = false
    @Published var conversationId: String?
    @Published var navigateToConversation: Bool = false
    var hasChats: Bool {
        cursor != nil
    }

    init(client: VGChatClient) {
        vgClient = client
        super.init()
        self.bindObservables()
        self.vgClient.getUser("me") { error, user in
            if let user = user {
                self.myUser = user
            } else {
                let error = error != nil ? "\(error!)" : "Unknown"
                print("Error in fetching self user \(error)")
            }
        }
    }
    
    override init() {
        fatalError("cant continue in chats without login")
    }
    
    func getConversations() {
        vgClient.getConversations(VGGetConversationsParameters(cursor: self.cursor, includeCustomData: true)) { error, page in
            DispatchQueue.main.async {
                if let error = error as? VGError {
                    self.alertType = .error(error.message)
                } else if let error = error {
                    self.alertType = .error(error.localizedDescription)
                } else if let page = page {
                    self.cursor = page.nextCursor
                    self.conversations.append(contentsOf: page.conversations)
                    if self.conversations.isEmpty {
                        self.alertType = .error("No conversations found for the user")
                    }
                }
            }
        }
    }
    
    func willAppear() {
        conversations = []
        cursor = nil
        self.getConversations()
    }

    func getChatViewModel() -> ChatViewModel? {
        guard let conversation = self.conversation else {
            return nil
        }
        return .init(client: vgClient, conversation: conversation)
    }
    
    func getChatViewModel(conversation: VGConversation) -> ChatViewModel {
        return .init(client: vgClient, conversation: conversation)
    }
    
    func getCreateConversationViewModel() -> CreateConversationViewModel {
        .init(client: vgClient)
    }
    
    func deleteConversation(at index: IndexSet) {
        let itemsToDelete = index.map { self.conversations[$0] }
        conversations.remove(atOffsets: index)
        itemsToDelete.forEach { conversation  in
            Task.detached {
                do {
                    try await self.vgClient.deleteConversation(conversation.id)
                } catch let error as VGError {
                    DispatchQueue.main.async {
                        self.alertType = .error(error.message)
                    }
                } catch let error {
                    DispatchQueue.main.async {
                        self.alertType = .error(error.localizedDescription)
                    }
                }
            }
        }
    }
    
    func onJoinConversation() {
        guard let id  = conversationId else { return }
        Task.detached {
            do {
                try await self.vgClient.joinConversation(id)
                DispatchQueue.main.async {
                    self.conversations = []
                }
                self.getConversations()
            } catch let error as VGError {
                DispatchQueue.main.async {
                    self.alertType = .error(error.message)
                }
            } catch let error {
                DispatchQueue.main.async {
                    self.alertType = .error(error.localizedDescription)
                }
            }
        }
    }
    
    func onViewConversation() {
        guard let id = conversationId else { return }
        vgClient.getConversation(id) { error, conversation in
            DispatchQueue.main.async {
                if let conversation = conversation {
                    self.conversation = conversation
                    self.navigateToConversation = true
                }
            }
        }
    }
    
    func onConversationJoinEvent() {
        guard let id = conversationId else { return }
        vgClient.getConversation(id) { error, conversation in
            DispatchQueue.main.async {
                if let conversation = conversation {
                    self.conversations.append(conversation)
                    self.conversation = conversation
                    self.navigateToConversation = true
                }
            }
        }
    }
    
    func onLogout() {
        vgClient.deleteSession { error in
            DispatchQueue.main.async {
                if let error = error as? VGError {
                    self.alertType = .error(error.message)
                } else if let error = error {
                    self.alertType = .error(error.localizedDescription)
                } else {
                    self.alertType = .logout
                }
            }
        }
    }
}

extension ChatsListViewModel {
    func bindObservables() {
        cancellable.forEach { observables in
            observables.cancel()
        }
        
        PushManager.shared.$pushPayload.sink { payload in
            guard let payload = payload else { return }
            let pushType = VGChatClient.vonagePushType(payload)
            switch pushType {
            case .memberInvited, .message:
                guard let event = try? self.vgClient.parsePushConversationEvent(payload) else { return }
                self.processIncomingEvent(event: event)
            default:
                break
            }
        }.store(in: &cancellable)
        
        // you will receive notification by both push and socket, you have to manage it
        ChatClientManager
            .shared
            .eventPublisher
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { event in
                self.processIncomingEvent(event: event)
            }).store(in: &cancellable)
    }
    
    private func processIncomingEvent(event: VGConversationEvent) {
        if myUser?.name == (event.from as? VGEmbeddedInfo)?.user.name {
             return
        }
        switch event.kind {
        case .memberInvited:
            self.conversationId = event.conversationId
            let event = event as! VGMemberInvitedEvent
            self.alertType = .invite(name: event.body.user.displayName ?? event.body.user.name )
        case .memberJoined:
            self.conversationId = event.conversationId
            self.alertType = .joined
        case .messageText:
            let from = event.from as? VGEmbeddedInfo
            let username = from?.user.name ?? "Admin"
            let displaName = from?.user.displayName ?? username
            let event = event as! VGMessageTextEvent
            if username == self.myUser?.name { return }
            self.conversationId = event.conversationId
            self.alertType = .conversation(sender: displaName, text: event.body.text)
        default:
            break // in progress
        }
    }
}
