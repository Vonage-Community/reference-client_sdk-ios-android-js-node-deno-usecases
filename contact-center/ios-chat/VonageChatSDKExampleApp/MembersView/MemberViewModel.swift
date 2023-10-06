//
//  MemberViewModel.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 07.06.23.
//

import Foundation
import VonageClientSDKChat
import Combine

class MemberViewModel: NSObject, ObservableObject {
    private let vgClient: VGChatClient
    private let cid: String
    @Published private(set) var imageURL: String = ""
    var name: String {
        member.user?.uiName ?? "N/A"
    }
    @Published var member: VGMember

    init(member: VGMember, vgClient: VGChatClient, cid: String) {
        self.member = member
        self.vgClient = vgClient
        self.cid = cid
        super.init()
        self.getMember()
        self.getUser()
    }
    
    func getMember() {
        vgClient.getConversationMember(cid, memberId: member.id) { _, member in
            guard let member = member else { return }
            DispatchQueue.main.async {
                self.member = member
            }
        }
    }
    
    func getUser() {
        vgClient.getUser(member.user?.id ?? "") { error, user in
            DispatchQueue.main.async {
                self.imageURL = user?.imageUrl ?? ""
            }
        }
    }
}
