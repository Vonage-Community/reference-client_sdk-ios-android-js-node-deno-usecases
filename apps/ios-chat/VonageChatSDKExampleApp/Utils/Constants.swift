//
//  Constants.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 11.06.23.
//

import Foundation

enum Constants {
    
    enum URLKeys: String {
        case apiLoginUrl = "API_LOGIN_URL", tokenRefreshUrl = "API_REFRESH_URL"
    }
    
    enum Strings: String {
        case unknownError = "unknown error", internalError = "internal error"
    }
}



enum Configuration {
    enum Error: Swift.Error {
        case missingKey, invalidValue
    }

    static func value<T>(for key: String) throws -> T where T: LosslessStringConvertible {
        guard let object = Bundle.main.object(forInfoDictionaryKey:key) else {
            throw Error.missingKey
        }

        switch object {
        case let value as T:
            return value
        case let string as String:
            guard let value = T(string) else { fallthrough }
            return value
        default:
            throw Error.invalidValue
        }
    }
    
    static func getURLFor(key: Constants.URLKeys) -> String {
        do {
            let urlString: String = try Self.value(for: key.rawValue)
            return urlString
        } catch {
            fatalError("Failed to get Code login url from secrets.xcConfig file")
        }
    }
    
    static let defaultToken : String = (try? value(for: "VONAGE_API_TOKEN")) ?? ""
}
