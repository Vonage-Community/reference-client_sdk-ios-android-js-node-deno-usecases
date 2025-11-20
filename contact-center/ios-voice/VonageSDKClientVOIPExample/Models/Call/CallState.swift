//
//  CallState.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

/// Represents the current state of a voice call
enum CallState {
    case ringing
    case active
    case holding
    case disconnected
    case reconnecting
}
