//
//  LoginAPI.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 18.06.23.
//

import Foundation

protocol ApiType {
    var url: String {get}
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
    var url: String = Configuration.getURLFor(key: .apiLoginUrl) 
    var method: String = "POST"
    var body: Encodable?
    
    init(body: LoginRequest) {
        self.body = body
    }
}
