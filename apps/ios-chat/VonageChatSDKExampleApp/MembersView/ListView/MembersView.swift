//
//  MembersView.swift
//  TestApp
//
//  Created by Mehboob Alam on 18.04.23.
//

import SwiftUI

struct MembersView: View {
    @StateObject private var viewModel: MembersViewModel
    @Environment(\.presentationMode) var presentation

    init(viewModel: MembersViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack{
            VStack {
                List {
                    Section(header: Text("Members in the conversation")) {
                        ForEach(viewModel.members) { item in
                            MemberView(viewModel: viewModel.getViewModel(for: item))
                                .deleteDisabled(viewModel.isSelfUser(member: item))
                        }.onDelete(perform: viewModel.onDeleteMembers(inRange:))
                    }
                    Section(header: Text("Add new member")) {
                        HStack {
                            TextField("Enter Username", text: $viewModel.username)
                                .autocorrectionDisabled()
                                .autocapitalization(.none)
                            Button("Add", action: viewModel.addMember)
                        }
                    }
                    if !viewModel.memberDetails.isEmpty {
                        Section(header: Text("Selected member details")) {
                            Text(viewModel.memberDetails)
                        }
                    }
                }
            }
            if viewModel.showProgress {
                ProgressView("Loading")
                    .progressViewStyle(.circular)
            }
        }
        .onAppear(perform: viewModel.getMyMember)
        .toolbar {
            Button("Leave Chat", action: viewModel.onLeaveConversation)
        }
        .navigationTitle("Details")
            .alert(isPresented: Binding<Bool>(
                get: { self.viewModel.error ?? "" != "" },
                set: {_ in self.viewModel.error = ""}
            )) {
                Alert(title: Text("Alert!!"),
                      message: Text(viewModel.error ?? ""),
                      dismissButton: .default(Text("Okey"), action: {
                    if viewModel.shouldDismiss {
                        self.presentation.wrappedValue.dismiss()
                    }
                }))
            }
    }
}
