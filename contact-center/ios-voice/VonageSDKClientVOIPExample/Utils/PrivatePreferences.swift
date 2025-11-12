//
//  PrivatePreferences.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.

import Foundation

enum PrivatePreferences {
    private static let defaults = UserDefaults.standard
    
    static let AUTH_TOKEN = "AUTH_TOKEN"
    static let REFRESH_TOKEN = "REFRESH_TOKEN"
    static let PUSH_TOKEN = "PUSH_TOKEN"
    static let DEVICE_ID = "DEVICE_ID"
    static let CALL_ID = "CALL_ID"
    static let CALLER_DISPLAY_NAME = "CALLER_DISPLAY_NAME"

    static func set(_ key: String, _ value: String?) {
        if let value { defaults.set(value, forKey: key) } else { defaults.removeObject(forKey: key) }
    }
    static func get(_ key: String) -> String? { defaults.string(forKey: key) }
}
