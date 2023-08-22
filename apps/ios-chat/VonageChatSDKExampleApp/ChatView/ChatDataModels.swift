//
//  ChatDataModels.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 11.06.23.
//

import Foundation

struct Message: Identifiable {
    let id: Int
    let sender: String
    let content: String
    let messageType: MessageType
}

enum MessageType {
    case text
    case url
    case video
    case audio
    case image
    case memberEvent
    case facebookTemplate(CustomMessageData.CustomPayload)
    case whatsappTemplate(WhatsAppResponse.WhatsAppInteractive)
    case customMessage(String)
    case unknown(type: String)
}

struct CustomMessageData: Codable {
    let attachment: CustomAttachments?
    
    struct CustomAttachments: Codable {
        let payload: CustomPayload?
    }
    
    struct CustomPayload:Codable {
        let template_type: String
        let text: String
        let buttons: [CustomPayloadButtons]
    }
    
    struct CustomPayloadButtons: Codable, Identifiable {
        var id: String {
            title
        }
        
        let type: String
        let title: String
        var payload: CustomButtonsPayload?
        
        init(from decoder: Decoder) throws {
            let values = try decoder.container(keyedBy: CodingKeys.self)
            self.type = try! values.decode(String.self, forKey: .type)
            self.title = try! values.decode(String.self, forKey: .title)
            let payload = try? values.decode(String.self, forKey: .payload)
            if let payLoadData = payload?.data(using: .utf8) {
                self.payload = try JSONDecoder().decode(CustomButtonsPayload.self,
                                                    from: payLoadData)
            }
        }
    }
    
    struct CustomButtonsPayload: Codable {
        let cid: String?
        let action: String?
        let botMid: String?
    }
}

struct WhatsAppResponse: Decodable {
    var interactive: WhatsAppInteractive?
    
    struct WhatsAppInteractive: Decodable {
        var action: WhatsAppAction?
        var body: WhatsAppBody?
        var footer: WhatsAppBody?
        var header: WhatsAppBody?
    }
    
    struct WhatsAppBody: Decodable {
        var text: String?
    }
    
    struct WhatsAppAction: Decodable {
        var buttons: [WhatsAppButtons]?
    }
    
    struct WhatsAppButtons: Decodable, Identifiable {
        var reply: WhatsAppReply?
        var id: String {
            reply?.id ?? ""
        }
    }
    
    struct WhatsAppReply: Decodable {
        var title: String?
        var id: String?
    }
}
