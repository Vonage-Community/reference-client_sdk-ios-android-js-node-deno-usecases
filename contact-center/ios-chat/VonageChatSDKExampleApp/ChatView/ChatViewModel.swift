//
//  ChatViewModel.swift
//  TestApp
//
//  Created by Mehboob Alam on 14.04.23.
//

import Foundation
import Combine
import VonageClientSDKChat

class ChatViewModel: NSObject,ObservableObject {
    private let vgClient: VGChatClient
    private var myMember: VGMember?
    private var cancellable: AnyCancellable?
    private var conversation: VGConversation
    @Published private(set) var members: [VGMember] = []
    @Published private(set) var shouldShowJoin = false
    @Published var error: String?
    @Published var isMyMemberAvailable: Bool = false
    @Published var messages: [Message] = []
    var hasMoreEvents: Bool {
        eventsPage?.nextCursor != nil
    }
    
    var conversationName: String {
        conversation.uiName
    }
    
    private var eventsPage: VGEventsPage? {
        willSet {
            DispatchQueue.main.async {
                self.messages.append(contentsOf: newValue?.events.map { self.getMessage(fromEvent: $0) } ?? [])
            }
        }
    }
    
    init(client: VGChatClient, conversation: VGConversation) {
        vgClient = client
        self.conversation = conversation
        super.init()
        bindDelegates()
    }
    
    override init() {
        fatalError("cant continue in chats without login")
    }
    
    func onViewAppear() {
        shouldShowJoin = [.unknown, .left, .invited].contains(conversation.memberState)
        getMyMember()
        getMembers()
    }
    
    func getMembersViewModel() -> MembersViewModel {
        .init(members: members, vgClient: vgClient, cid: conversation.id)
    }
    
    private func processFailure(error: Error?) {
        DispatchQueue.main.async {
            if let error = error as? VGError {
                let message = error.message ?? ""
                
                self.error = message
            } else if let error = error {
                let message = error.localizedDescription
                self.error = message
            }
        }
    }
    
    private func getMessage(fromEvent event: VGConversationEvent) -> Message {
        var sender = "Admin"
        var displayName = sender
        if let embeddedInfo = event.from as? VGEmbeddedInfo {
            sender = embeddedInfo.user.name
            displayName = embeddedInfo.user.displayName ?? sender
        }
        let senderName = sender == myMember?.user?.name ? "You" : displayName
        switch event {
        case let event as VGMemberInvitedEvent:
            let content = "EVENT: '\(event.body.user.name)' has been invited by '\(senderName)'"
            return Message(id: event.id,
                           sender: event.body.user.name,
                           content: content,
                           messageType: .memberEvent)
            
        case let event as VGMemberJoinedEvent:
            let content = "EVENT: '\(event.body.user.name)' has Joined the conversation"
            return Message(id: event.id,
                           sender: event.body.user.name,
                           content: content,
                           messageType: .memberEvent)
            
        case let event as VGMemberLeftEvent:
            let content = "EVENT: '\(event.body.user.name)' has Left the conversation"
            return Message(id: event.id,
                           sender: event.body.user.name,
                           content: content,
                           messageType: .memberEvent)
        case let event as VGMessageTextEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.text,
                           messageType: .text)
        
        case let event as VGMessageCustomEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: "",
                           messageType: getCustomMessageTemplate(dataString: event.body.customData))
        case let event as VGMessageAudioEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.audioUrl,
                           messageType: .audio)
        case let event as VGMessageFileEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.fileUrl,
                           messageType: .url)
        case let event as VGMessageLocationEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: "\(event.body.location)",
                           messageType: .text)
        case let event as VGMessageVCardEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.vcardUrl,
                           messageType: .url)
        case let event as VGMessageImageEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.imageUrl,
                           messageType: .image)
        case let event as VGMessageVideoEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: event.body.videoUrl,
                           messageType: .video)
        case let event as VGMessageTemplateEvent:
            return Message(id: event.id,
                           sender: senderName,
                           content: "\(event.body.templateObject)",
                           messageType: .text)
        default:
            return Message(id: 0, sender: "N/a", content: "N/a", messageType: .unknown(type: ""))
        }
    }
    
    func getMyMember() {
        Task.detached {
            do {
                let member = try await self.vgClient.getConversationMember(self.conversation.id, memberId: "me")
                DispatchQueue.main.async {
                    self.myMember = member
                    self.isMyMemberAvailable = true
                    self.shouldShowJoin = [.unknown, .left, .invited].contains(member.state)
                }
            } catch {
                DispatchQueue.main.async {
                    self.isMyMemberAvailable = true
                    self.shouldShowJoin = true
                }
            }
        }
    }
    
    func getConversationEvents() {
        Task.detached {
            do {
                let params = VGGetConversationEventsParameters()
                params.cursor = self.eventsPage?.nextCursor
                params.order = .desc
                let events = try await self.vgClient.getConversationEvents(self.conversation.id, parameters: params)
                DispatchQueue.main.async {
                    self.eventsPage = events
                }
            } catch {
                self.processFailure(error: error)
            }
        }
    }
    
    func getMembers() {
        DispatchQueue.main.async {
            self.members = []
        }
        Task.detached {
            var cursor: String? = nil
            repeat {
                do {
                    let params = VGGetConversationMembersParameters()
                    params.cursor = cursor
                    let membersPage = try await self.vgClient.getConversationMembers(self.conversation.id, parameters: params)
                    cursor = membersPage.nextCursor
                    DispatchQueue.main.async {
                        self.members.append(contentsOf: membersPage.members)
                    }
                } catch {
                    self.processFailure(error: error)
                }
            } while(cursor?.isEmpty == false)
            self.getConversationEvents()
        }
    }
    
    func sendMessage(message: String) {
        switch true {
        case message.isEmpty:
            error = "Message cannot be empty"
        default:
            vgClient.sendMessageTextEvent(conversation.id, text: message) { error, timeStamp in
                DispatchQueue.main.async {
                    self.processFailure(error: error)
                }
            }
        }
    }
    
    func onJoinConversation() {
        vgClient.joinConversation(conversation.id) { error, id in
            self.processFailure(error: error)
            self.getMyMember()
        }
    }
    
    func onDeleteEvent(indexSet: IndexSet) {
        let itemsToDelete = indexSet.map { self.messages[$0] }
        itemsToDelete.forEach { item  in
            vgClient.deleteEvent(item.id, conversationId: conversation.id) { [item] error in
                DispatchQueue.main.async {
                    guard let error = error else {
                        self.messages.removeAll(where: { item.id == $0.id})
                        return
                    }
                    self.processFailure(error: error)
                }
            }
        }
        
    }
    
    func getCustomMessageTemplate(dataString: String) -> MessageType {
        guard let data = dataString.data(using: .utf8) else {
            return .customMessage(dataString)
        }
        do {
            let data = try JSONDecoder().decode(WhatsAppResponse.self, from: data)
            print(data)
        } catch {
            print("\n\n\nError in parsing \(error)\n\n\n")
        }
        if let data = try? JSONDecoder().decode(CustomMessageData.self, from: data), let payload = data.attachment?.payload {
            return .facebookTemplate(payload)
        } else if let data = try? JSONDecoder().decode(WhatsAppResponse.self, from: data).interactive {
            return .whatsappTemplate(data)
        } else {
            return .customMessage(dataString)
        }
    }
    
    func sendCustomMessage() {
        guard let json = getCustomMessageObject() else {
            return
        }
        vgClient.sendMessageCustomEvent(conversation.id, customData: json) {error, timeStamp in
            DispatchQueue.main.async {
                if let error = error as? VGError {
                    self.error = error.message
                } else if let error = error {
                    self.error = error.localizedDescription
                } else if let timeStamp = timeStamp {
                    print("Message sent successfully with : \(timeStamp)")
                } else {
                    self.error = "Something went wrong!!!"
                }
            }
        }
    }
    
    func getCustomMessageObject() -> String? {
        let actionJson = ["cid": conversation.id,
                           "action": "none"]

        do {
            let action = try JSONSerialization.data(withJSONObject: actionJson, options: .prettyPrinted)
            let actionObject = String(data: action, encoding: .utf8) ?? ""
            
            let data = try JSONSerialization.data(withJSONObject: getCustomJson(actionPayload: actionObject), options: .prettyPrinted)
            
            let object = String.init(data: data, encoding: .utf8)!
            print(object)
            return object
        } catch {
            print(error.localizedDescription, error)
            return nil
        }
    }
    
    private func getCustomJson(actionPayload: String) -> [String: Any] {
        [
            "attachment": [
                "payload": [
                    "buttons": [
                        [
                            "url": "https://nexmoinc.github.io/conversation-service-docs/docs/events/",
                            "title": "Go to survey",
                            "type": "web_url"
                        ],
                        [
                            "payload": actionPayload,
                            "title": "No Thanks",
                            "type": "postback"
                        ]
                    ],
                    "template_type": "button",
                    "text": "Thanks, I hope, I was able to solve your issue, Please do a short survey about my services"
                ] as [String : Any],
                "type": "template"
            ] as [String : Any]
        ]
    }
}

extension ChatViewModel {
    
    func bindDelegates() {
        cancellable = ChatClientManager
            .shared
            .eventPublisher
            .receive(on: DispatchQueue.main)
            .sink(receiveValue: { event in
                print("\(event.kind) received")
                // Insert at beginning due to reversed chat view
                self.messages.insert(self.getMessage(fromEvent: event), at: 0)
            })
    }
}
