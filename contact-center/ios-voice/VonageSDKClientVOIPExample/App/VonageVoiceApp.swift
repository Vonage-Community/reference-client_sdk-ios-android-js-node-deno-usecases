//
//  VonageVoiceApp.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import SwiftUI

@main
struct VonageVoiceApp: App {
    @StateObject private var coreContext = CoreContext.shared
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(coreContext)
                .onAppear {
                    // Pass core context to app delegate for push notification handling
                    appDelegate.coreContext = coreContext
                }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject private var coreContext: CoreContext
    
    var body: some View {
        NavigationStack {
            if coreContext.voiceClientManager.sessionId != nil {
                MainView()
            } else {
                LoginView()
            }
        }
    }
}
