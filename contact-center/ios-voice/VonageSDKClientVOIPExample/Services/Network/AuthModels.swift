//
//  AuthModels.swift
//  VonageSDKClientVOIPExample
//
//  Created by Mehboob Alam on 27.06.23.
//

import Foundation

// MARK: - API Type Protocol

/// Protocol defining the requirements for an API endpoint
protocol ApiType {
    var url: URL { get }
    var method: String { get }
    var headers: [String: String] { get }
    var body: Encodable? { get }
}

extension ApiType {
    var headers: [String: String] {
        [
            "Content-Type": "application/json"
        ]
    }
}

// MARK: - Auth API Endpoints

/// API endpoint for code-based login
struct CodeLoginAPI: ApiType {
    var url: URL = Configuration.getLoginUrl()
    var method: String = "POST"
    var body: Encodable?

    init(body: LoginRequest) {
        self.body = body
    }
}

/// API endpoint for refreshing authentication token
struct RefreshTokenAPI: ApiType {
    var url: URL = Configuration.getRefreshTokenUrl()
    var method: String = "POST"
    var body: Encodable?

    init(refreshToken: String) {
        body = RefreshTokenRequest(refreshToken: refreshToken)
    }
}

// MARK: - Request Models

/// Request model for code-based login
struct LoginRequest: Encodable {
    let code: String
    let type: String = "login"
    let availability: String = "VOICE" // Possible Values CHAT, VOICE, ALL
}

/// Request model for token refresh
struct RefreshTokenRequest: Encodable {
    let refreshToken: String
    let type: String = "refresh"
}

// MARK: - Response Models

/// Response model containing authentication tokens
struct TokenResponse: Decodable {
    let vonageToken: String
    let refreshToken: String
}
