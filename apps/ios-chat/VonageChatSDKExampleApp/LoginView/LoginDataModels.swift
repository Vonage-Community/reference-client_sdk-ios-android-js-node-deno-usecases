//
//  LoginDataModels.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 11.06.23.
//

import Foundation

enum LoginType: String, Identifiable {
    public var id: String {
        return self.rawValue
    }
    
    case code = "Code", token = "Vonage Token"
}

struct LoginRequest: Encodable {
    let code: String
    let type: String = "login"
    let availability: String = "CHAT" // Possible Values CHAT, VOICE, ALL
}


struct TokenResponse: Decodable {
    let vonageToken: String
    let refreshToken: String
}

struct User: Codable {
    let token: String
}


struct RefreshTokenRequest: Encodable {
    let refreshToken: String
    let type: String = "refresh"
}
