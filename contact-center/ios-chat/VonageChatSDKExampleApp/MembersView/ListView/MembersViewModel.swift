//
//  MembersViewModel.swift
//  TestApp
//
//  Created by Mehboob Alam on 18.04.23.
//

import Foundation
import VonageClientSDKChat

class MembersViewModel: NSObject, ObservableObject {
    private(set) var members: [VGMember]
    private let vgClient: VGChatClient
    private let cid: String
    @Published var myMember: VGMember?
    @Published var error: String?
    @Published var username: String = ""
    @Published var memberDetails: String = ""
    @Published var showProgress = false
    @Published var shouldDismiss = false
    init(members: [VGMember], vgClient: VGChatClient, cid: String) {
        self.members = members
        self.vgClient = vgClient
        self.cid = cid
    }
    
    func onDeleteMembers(inRange range: IndexSet) {
//        let membersTobeDeleted = range.map { members[$0] }
//        members.remove(atOffsets: range)
        error = "Remove Member not supported by the sdk"
    }
    
    func onLeaveConversation() {
        showProgress = true
        vgClient.leaveConversation(cid) { error in
            DispatchQueue.main.async {
                self.showProgress = false
                self.shouldDismiss = true
                if error == nil {
                    self.error = "You left the conversation"
                } else if let error = error as? VGError {
                    self.error =  error.message ?? "error"
                } else if let error = error {
                    self.error = error.localizedDescription
                }
            }
        }
    }
    
    func addMember() {
        if username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return
        }
        showProgress = true
        vgClient.inviteToConversation(cid, username: username) { error, memberId in
            DispatchQueue.main.async {
                self.showProgress = false
                if let error = error as? VGError {
                    let message = error.message ?? ""
                    self.error = message
                } else if let error = error {
                    let message = error.localizedDescription
                    self.error = message
                } else {
                    self.error = "Member Invited successfully"
                }
            }
        }
        username = ""
    }
    
    func getViewModel(for member: VGMember) -> MemberViewModel {
        .init(member: member,
              vgClient: vgClient,
              cid: cid)
    }
    
    func getMyMember() {
        self.vgClient.getConversationMember(cid, memberId: "me") { error, member in
            DispatchQueue.main.async {
                self.myMember = member
            }
        }
    }
    
    func isSelfUser(member: VGMember) -> Bool {
        member.user?.id == myMember?.user?.id
    }
}
