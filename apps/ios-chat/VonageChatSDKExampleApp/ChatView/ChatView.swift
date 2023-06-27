//
//  ChatView.swift
//  TestApp
//
//  Created by Mehboob Alam on 14.04.23.
//

import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel: ChatViewModel
    @State private var message = ""
    init (viewModel: ChatViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
        UITableView.appearance().separatorStyle = .none
    }
    
    var body: some View {
        NavigationView {
            VStack {
                List {
                    let view = ForEach(viewModel.messages) {message in
                        switch message.messageType {
                        case .text:
                            TextMessageView(message: message)
                        case .facebookTemplate(let data):
                            FacebookMessageView(message: data, sender: message.sender)
                        case .whatsappTemplate(let data):
                            WhatsAppMessageView(message: data, sender: message.sender)
                        case .customMessage(let data):
                            CustomMessageView(message: data, sender: message.sender)
                        case .image:
                            ImageMessageView(message: message)
                        case .memberEvent, .unknown:
                            UnknownEventView(message: message)
                        
                        }
                    }.listRowBackground(Color.clear)
                    if #available(iOS 15, *) {
                        view.listRowSeparator(.hidden)
                    }
                }.onAppear(perform: viewModel.onViewAppear)
                Divider().frame(maxHeight: 1).padding(.all, 0)
                if !viewModel.shouldShowJoin {
                    HStack {
                        TextEditor(text: $message)
                            .frame(maxHeight: 70)
                            .border(Color.gray)
                            .cornerRadius(5)
                            .padding()
                        VStack(spacing: 10) {
                            Button("Send", action: {
                                viewModel.sendMessage(message: message)
                                message = ""
                            })
                            Button(action: viewModel.sendCustomMessage) {
                                Image(systemName: "link")
                            }

                        }.padding(.trailing, 10)
                    }
                }
            }
        }.toolbar {
            if !viewModel.members.isEmpty && viewModel.isMyMemberAvailable {
                NavigationLink("details",
                               destination: MembersView(viewModel: viewModel.getMembersViewModel()))
            }
            if viewModel.shouldShowJoin {
                Button("Join", action: viewModel.onJoinConversation)
            }
        }.onAppear()
        .navigationTitle(viewModel.conversationName)
            .alert(isPresented: Binding<Bool>(
                get: { self.viewModel.error ?? "" != "" },
                set: {_ in self.viewModel.error = ""}
            )) {
                Alert(title: Text("Ops!!.."),
                      message: Text(viewModel.error ?? ""),
                      dismissButton: .default(Text("Okey")))
            }
        
    }
}

struct UnknownEventView: View {
    let message: Message
    var body: some View {
        Text(message.content)
            .foregroundColor(Color(UIColor.lightGray))
            .fontWeight(.regular)
            .font(Font(UIFont.italicSystemFont(ofSize: 13)))
            .frame(maxWidth: .infinity, alignment: .center)
    }
}

struct TextMessageView: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.sender == "You" {
                VStack(alignment: .trailing) {
                    Text(message.content)
                        .padding(10)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    Text("By: \(message.sender)")
                        .foregroundColor(Color(UIColor.lightGray))
                        .fontWeight(.regular)
                        .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            } else {
                VStack(alignment: .leading) {
                    Text(message.content)
                        .padding(10)
                        .background(Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    Text("By: \(message.sender)")
                        .foregroundColor(Color(UIColor.lightGray))
                        .fontWeight(.regular)
                        .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(.horizontal)
    }
}

struct ImageMessageView: View {
    let message: Message
    
    var body: some View {
        VStack {
            Image(message.content)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .cornerRadius(10)
            Text("By: \(message.sender)")
                .foregroundColor(Color(UIColor.lightGray))
                .fontWeight(.regular)
                .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                .frame(maxWidth: .infinity, alignment: .trailing)
            if message.sender != "You" {
                Text(message.sender)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("By: \(message.sender)")
                    .foregroundColor(Color(UIColor.lightGray))
                    .fontWeight(.regular)
                    .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(.horizontal)
    }
}

struct FacebookMessageView: View {
    let message: CustomMessageData.CustomPayload
    let sender: String
    var body: some View {
        HStack {
                VStack(alignment: sender == "You" ? .trailing : .leading) {
                    VStack(alignment: .center, spacing: 8) {
                        Text(message.text)
                            .font(.headline)
                            .foregroundColor(.black)
                        ForEach(message.buttons) { button in
                            Button(action: {}) {
                                Text(button.title)
                                    .font(.subheadline)
                                    .foregroundColor(.white)
                                    .padding()
                                    .background(Color.blue)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(10)
                    Text("By: \(sender)")
                        .foregroundColor(Color(UIColor.lightGray))
                        .fontWeight(.regular)
                        .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                        .frame(maxWidth: .infinity, alignment: sender == "You" ? .trailing : .leading)
                }
            }
        .padding(.horizontal)
    }
}


struct WhatsAppMessageView: View {
    let message: WhatsAppResponse.WhatsAppInteractive
    let sender: String
    var body: some View {
        HStack {
            VStack(alignment: sender == "You" ? .trailing : .leading) {
                VStack(alignment: .center, spacing: 8) {
                    if let text = message.header?.text {
                        Text(text)
                            .font(.headline)
                            .foregroundColor(.black)
                    }
                    Text(message.body?.text ?? "No message body")
                        .font(.headline)
                        .foregroundColor(.black)
                    if let text = message.footer?.text {
                        Text(text)
                            .font(.headline)
                            .foregroundColor(.black)
                    }
                    ForEach(message.action?.buttons ?? []) { button in
                        Button(action: {}) {
                            Text(button.reply?.title ?? "N/A")
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(8)
                            
                        }
                    }
                    
                }
                .padding()
                .background(Color.gray.opacity(0.2))
                .cornerRadius(10)
                Text("By: \(sender)")
                    .foregroundColor(Color(UIColor.lightGray))
                    .fontWeight(.regular)
                    .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                    .frame(maxWidth: .infinity, alignment: sender == "You" ? .trailing : .leading)
            }
        }
        .padding(.horizontal)
    }
}

struct CustomMessageView: View {
    let message: String
    let sender: String
    var body: some View {
        HStack {
                VStack(alignment: sender == "You" ? .trailing : .leading) {
                    VStack(alignment: .center, spacing: 8) {
                        Text(message)
                            .font(.headline)
                            .foregroundColor(.black)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(10)
                    Text("By: \(sender)")
                        .foregroundColor(Color(UIColor.lightGray))
                        .fontWeight(.regular)
                        .font(Font(UIFont.italicSystemFont(ofSize: 12)))
                        .frame(maxWidth: .infinity, alignment: sender == "You" ? .trailing : .leading)
                }
            }
        .padding(.horizontal)
    }
}

