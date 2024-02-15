//
//  VonagePreferences.swift
//  Runner
//
//  Created by Nathan Tamez on 08/02/2024.
//

import Foundation

class VonagePreferences {
    
    let preferences = UserDefaults.standard
    
    private let voipTokenKey = "com.vonage.fluttervoice::voipToken"
    private let deviceIdKey = "com.vonage.fluttervoice::deviceId"
    private let vonageJwtKey = "com.vonage.fluttervoice::vonageJwt"

    
    var voipToken: Data? {
        get { preferences.data(forKey: voipTokenKey) }
        set { preferences.set(newValue, forKey: vonageJwtKey) }
    }
    
    var deviceId: String? {
        get { preferences.string(forKey: deviceIdKey) }
        set { preferences.set(newValue, forKey: deviceIdKey) }
    }
    
    var vonageJwt: String? {
        get { preferences.string(forKey: vonageJwtKey) }
        set { preferences.set(newValue, forKey: vonageJwtKey) }
    }
    
}
