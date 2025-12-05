//
//  Data+Extensions.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import Foundation

extension Data {
    /// Converts Data to a hexadecimal string representation
    var hexString: String {
        return map { String(format: "%02.2hhx", $0) }.joined()
    }
    
    /// Initializes Data from a hexadecimal string
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            let bytes = hexString[i..<j]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
            i = j
        }
        self = data
    }
}
