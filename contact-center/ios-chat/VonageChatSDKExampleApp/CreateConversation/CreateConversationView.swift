//
//  CreateConversationView.swift
//  TestApp
//
//  Created by Mehboob Alam on 18.04.23.
//

import SwiftUI

struct CreateConversationView: View {
    @StateObject private var viewModel: CreateConversationViewModel
    @Environment(\.presentationMode) var presentation
    
    init(viewModel: CreateConversationViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        Form {
            Section(header: Text("Create Conversation Form")) {
                TextField("Conversation Name", text: $viewModel.name)
                    .autocorrectionDisabled()
                    .autocapitalization(.none)
                TextField("Display Name", text: $viewModel.displayName)
                    .autocorrectionDisabled()
                    .autocapitalization(.none)
                Button("Create & Join", action: viewModel.createConversation)
                    .frame(maxWidth: .infinity ,alignment: .center)
            }
            Section(header: Text("--- or ---")
                .frame(maxWidth: .infinity, alignment: .center)
                .foregroundColor(.gray)
                .background(Color.clear)) {}
            Section(header: Text("Join conversation")) {
                HStack {
                    TextField("Enter Conversation Id", text: $viewModel.cid)
                    Button("Join", action: viewModel.onJoinConversation)
                }
            }
        }
        .navigationTitle("Create Conversation")
        .alert(isPresented: Binding<Bool>(
            get: { self.viewModel.error ?? "" != "" },
            set: {_ in self.viewModel.error = ""}
        )) {
            Alert(title: Text("Alert!!.."),
                  message: Text(viewModel.error ?? ""),
                  dismissButton: .default(Text("Okey"), action: {
                if !viewModel.cid.isEmpty {
                    presentation.wrappedValue.dismiss()
                }
            }))
        }
    }
}
