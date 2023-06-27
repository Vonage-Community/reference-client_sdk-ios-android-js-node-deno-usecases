//
//  ChatsListView.swift
//  TestApp
//
//  Created by Mehboob Alam on 14.04.23.
//

import SwiftUI

struct ChatsListView: View {
    @StateObject var viewModel: ChatsListViewModel
    @Environment(\.presentationMode) var presentation

    init(viewModel: ChatsListViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        List {
            ForEach(viewModel.conversations) { conversation in
                NavigationLink(destination: ChatView(viewModel: viewModel.getChatViewModel(conversation: conversation))) {
                    Text(conversation.uiName)
                }
            }.onDelete(perform: viewModel.deleteConversation(at:))
        }
        .toolbar {
            NavigationLink(destination: CreateConversationView(viewModel: viewModel.getCreateConversationViewModel()), label: { Image(systemName: "plus") })
        }
        .onAppear(perform: viewModel.willAppear)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Logout", action: viewModel.onLogout)
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationDestination(isPresented: $viewModel.navigateToConversation) {
            if let vm = viewModel.getChatViewModel() {
                ChatView(viewModel: vm)
            }
        }
        .alert(item: $viewModel.alertType, content: { element in
            switch element {
            case .error(let message):
                return Alert(title: Text("Ops's!!"),
                             message: Text(message ?? "Error"),
                             dismissButton: .default(Text("OK")))
            case .invite(let name):
                return Alert(title: Text("Member Invited"),
                             message: Text("You have been invited to a conversation by: \(name)"),
                             primaryButton: .default(Text("Join"), action: viewModel.onJoinConversation),
                             secondaryButton: .cancel(Text("Not Now")))
            case .joined:
                return Alert(title: Text("Conversation started"),
                             message: Text("You have been added to a conversation"),
                             dismissButton: .default(Text("Okey"), action: viewModel.onConversationJoinEvent))
            case .logout:
                return Alert(title: Text("Logout successful"),
                             message: Text("You have been logged out successfully"),
                             dismissButton: .default(Text("Okey"), action: {
                    presentation.wrappedValue.dismiss()
                }))
                
            }
        })
        .navigationTitle("Conversations")
    }
}
