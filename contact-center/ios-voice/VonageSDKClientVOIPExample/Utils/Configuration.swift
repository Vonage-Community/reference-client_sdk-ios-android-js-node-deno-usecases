//
//  Configuration.swift
//  VonageSDKClientVOIPExample
//
//  Created by Mehboob Alam on 27.06.23.
//
import Foundation

enum Configuration {

    static func value(for key: String) -> String? {
        guard let object = Bundle.main.object(forInfoDictionaryKey:key) else {
            return nil
        }

        switch object {
        case let value as String:
            return value
        default:
            return nil
        }
    }

    static func getLoginUrl() -> URL {
        guard let urlString = Self.value(for: "API_LOGIN_URL"),
              let url = URL(string: urlString) else {
            fatalError("Secret file doesn't contain any valid url 'API_LOGIN_URL'");
        }
        return url
    }

    static func getRefreshTokenUrl() -> URL {
        guard let urlString = Self.value(for: "API_REFRESH_URL"),
              let url = URL(string: urlString) else {
            fatalError("Secret file doesn't contain any valid url 'API_REFRESH_URL'");
        }
        return url
    }
    
    static let defaultToken : String = value(for: "VONAGE_API_TOKEN") ?? ""
}
