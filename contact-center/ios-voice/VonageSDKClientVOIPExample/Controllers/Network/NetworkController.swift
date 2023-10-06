//
//  NetworkController.swift
//  VonageSDKClientVOIPExample
//
//  Created by Mehboob Alam on 27.06.23.
//
import Foundation

import Foundation
import Combine

/// API TYPE
protocol ApiType {
    var url: URL {get}
    var method: String {get}
    var headers: [String: String] {get}
    var body: Encodable? {get}
}

extension ApiType {
    var headers: [String: String] {
        [
            "Content-Type": "application/json"
        ]
    }
}

/// LOGIN VIA CODE
struct CodeLoginAPI: ApiType {
    var url: URL = Configuration.getLoginUrl()
    var method: String = "POST"
    var body: Encodable?

    init(body: LoginRequest) {
        self.body = body
    }
}

/// Refreesh Token
struct RefreshTokenAPI: ApiType {
    var url: URL = Configuration.getRefreshTokenUrl()
    var method: String = "POST"
    var body: Encodable?

    init(refreshToken: String) {
        body = RefreshTokenRequest(refreshToken: refreshToken)
    }
}



class NetworkController {
    func sendRequest<type: Decodable>(apiType: any ApiType) -> AnyPublisher<type, Error> {
        var request = URLRequest(url: apiType.url)
        request.httpMethod = apiType.method
        request.allHTTPHeaderFields = apiType.headers
        do {
            if let body = apiType.body {
                request.httpBody = try JSONEncoder().encode(body)
            }
        } catch {
            return Fail(error: error).eraseToAnyPublisher()
        }
        return URLSession
            .shared
            .dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse,
                      200..<300 ~= httpResponse.statusCode else {
                    let error = try? JSONSerialization.jsonObject(with: data)
                    print(error ?? "unknown")
                    throw URLError(.badServerResponse)
                }
                return data
            }
            .decode(type: type.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
}

/// NetworkData Models
struct LoginRequest: Encodable {
    let code: String
    let type: String = "login"
    let availability: String = "VOICE" // Possible Values CHAT, VOICE, ALL
}

struct TokenResponse: Decodable {
    let vonageToken: String
    let refreshToken: String
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String
    let type: String = "refresh"
}
