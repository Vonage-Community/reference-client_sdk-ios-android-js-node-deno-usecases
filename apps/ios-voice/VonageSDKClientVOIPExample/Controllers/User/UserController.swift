//
//  UserController.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//

import Foundation
import Combine
 
typealias UserToken = String

enum UserControllerErrors:Error {
    case InvalidCredentials
    case unknown
}



class UserController: NSObject {
    
    var user =  PassthroughSubject<(User,UserToken)?,UserControllerErrors>()
    var token = ""
    var refreshToken = ""
    
    private var cancellable: AnyCancellable?

    func login(username:String, token:String, refreshToken: String = "") {
        self.refreshToken = refreshToken
        self.token = token
        // Dummy Implementation for testing purposes
        user.send((User(uname: username), token))
        UserDefaults.standard.setValue(username, forKey: "USERNAME")
        UserDefaults.standard.setValue(token, forKey: "TOKEN")
        UserDefaults.standard.setValue(refreshToken, forKey: "REFRESH_TOKEN")
    }
    
    func restoreUser() {
        guard let username = UserDefaults.standard.string(forKey: "USERNAME"),
        let token =  UserDefaults.standard.string(forKey: "TOKEN"),
        let refreshToken =  UserDefaults.standard.string(forKey: "REFRESH_TOKEN") else { return }
        
        self.token = token
        self.refreshToken = refreshToken
        
        // Dummy Implementation for testing purposes
        user.send((User(uname: username), token))
    }
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: "USERNAME")
        UserDefaults.standard.removeObject(forKey: "TOKEN")
        UserDefaults.standard.removeObject(forKey: "REFRESH_TOKEN")
        user.send(nil)
    }
    
}
