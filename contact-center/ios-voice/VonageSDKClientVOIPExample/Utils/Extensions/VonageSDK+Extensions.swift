//
//  VonageSDK+Extensions.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 11/11/2025.
//

import VonageClientSDKVoice

/// Make VGSessionErrorReason conform to Error protocol for better error handling
extension VGSessionErrorReason: @retroactive Error {}
