//
//  ChatView+DataModel.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 07.06.23.
//

import Foundation
import VonageClientSDKChat


extension VGMemberState {
    var description: String {
        switch self {
            
        case .invited:
            return "INVITED"
        case .joined:
            return "JOINED"
        case .left:
            return "LEFT"
        default:
            return "UNKNOWN"
        }
    }
}

extension VGChannelType {
    var description: String {
        switch self {
        case .app:
            return "App"
        case .messenger:
            return "Messenger"
        case .mms:
            return "MMS"
        case .phone:
            return "Phone"
        case .pstn:
            return "PSTN"
        case .sip:
            return "SIP"
        case .unknown:
            return "Unknown"
        case .sms:
            return "SMS"
        case .vbc:
            return "VBC"
        case .viber:
            return "Viber"
        case .whatsapp:
            return "WhatsApp"
        case .websocket:
            return "Websocket"
            
        @unknown default:
            fatalError("unkown channel encountered")
        }
    }
}

extension VGMember: Identifiable {
    
}

extension VGErrorType {
    var type: String {
        switch self {
        case .csError:
            return "CS Error"
        case .httpClientError:
            return "HttpClient Error"
        case .sessionError:
            return "Session Error"
        case .internalError:
            return Constants.Strings.internalError.rawValue
        case .unknownError:
            return Constants.Strings.unknownError.rawValue
        @unknown default:
            return Constants.Strings.unknownError.rawValue
        }
    }
}

extension VGConversation: Identifiable {}

extension VGConversation {
    var uiName: String {
        return displayName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? displayName! : name
    }
}

extension VGUser {
    var uiName: String {
        return displayName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? displayName! : name
    }
}

extension String: Identifiable {
    public var id: Self {
        self
    }
}
