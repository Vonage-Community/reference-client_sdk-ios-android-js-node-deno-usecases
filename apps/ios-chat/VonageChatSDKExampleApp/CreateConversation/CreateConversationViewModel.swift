//
//  CreateConversationViewModel.swift
//  TestApp
//
//  Created by Mehboob Alam on 18.04.23.
//

import Foundation
import VonageClientSDKChat


class CreateConversationViewModel: NSObject,ObservableObject {
    private let vgClient: VGChatClient
    @Published var error: String?
    @Published var name: String = ""
    @Published var cid: String = ""
    @Published var displayName: String = ""
    
    init(client: VGChatClient) {
        vgClient = client
    }
    
    override init() {
        fatalError("cant continue in chats without login")
    }
    
    func onJoinConversation() {
        Task.detached {
            do {
                let cid = try await self.vgClient.joinConversation(self.cid)
                DispatchQueue.main.async {
                    self.error = "You Joined Conversation: \(cid) successfully"
                    self.displayName = ""
                    self.name = ""
                    self.cid = cid
                }
            }catch let error as VGError {
                DispatchQueue.main.async {
                    self.error = error.message
                }
            } catch let error {
                DispatchQueue.main.async {
                    self.error = error.localizedDescription
                }
            }
        }
    }
    
    func createConversation() {
        let name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let displayName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else {
            error = "Please enter a valid name"
            return
        }
        Task.detached {
            do {
                let cid = try await self.vgClient.createConversation(name, displayName: displayName)
                DispatchQueue.main.async {
                    self.error = "Conversation: \(cid) Created successfully"
                    self.displayName = ""
                    self.name = ""
                    self.cid = cid
                }
                try await self.vgClient.joinConversation(cid)
            } catch let error as VGError {
                DispatchQueue.main.async {
                    self.error = error.message
                }
            } catch let error {
                DispatchQueue.main.async {
                    self.error = error.localizedDescription
                }
            }
        }
    }
}

