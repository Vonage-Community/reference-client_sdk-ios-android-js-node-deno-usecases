//
//  UUID+Extensions.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 12/02/2023.
//

import Foundation

extension UUID {
    /// Converts UUID to Vonage Call ID format (lowercase string)
    func toVGCallID() -> String {
        uuidString.lowercased()
    }
}
