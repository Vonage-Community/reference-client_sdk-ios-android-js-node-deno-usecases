//
//  ContentView.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 15.05.23.
//

import SwiftUI
import VonageClientSDKChat

struct LoginView: View {
    @ObservedObject var viewModel: LoginViewModel = .init()
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Enter \(viewModel.selectedLoginType.rawValue)...", text: $viewModel.username)
                            .frame(maxWidth: .infinity, idealHeight: 50, alignment: .leading)
                            .autocorrectionDisabled()
                            .autocapitalization(.none)
                    Picker("Login via", selection: $viewModel.selectedLoginType) {
                        ForEach(viewModel.loginTypes, id: \.self) {
                            Text($0.rawValue)
                        }
                    }
                    .pickerStyle(.menu)
                    .onChange(of: viewModel.selectedLoginType) { value in
                        viewModel.onLoginTypeChange(type: value)
                    }
                }
                Section {
                    Button("Login", action: {
                        viewModel.login()
                    }).frame(maxWidth: .infinity, idealHeight: 40, alignment: .center)
                }
            }
        }
        .navigationDestination(isPresented: $viewModel.isSessionActive) {
            ChatsListView(viewModel: viewModel.getChatsListsViewModel())
        }
        .navigationTitle("Login")
        .alert(isPresented: Binding<Bool>(
            get: { !self.viewModel.error.isEmpty },
            set: {_ in self.viewModel.error = ""}
        )) {
            Alert(title: Text("Alert!!"),
                  message: Text(viewModel.error),
                  dismissButton: .default(Text("Okey")))
        }
        
    }
}
