//
//  SceneDelegate.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//

import UIKit
import Combine

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    var nav: UINavigationController!
    private var cancellables = Set<AnyCancellable>()

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // A new scene was added to the app.
        guard let scene = (scene as? UIWindowScene) else { return }

        self.window = UIWindow(windowScene: scene)
        self.window?.rootViewController = createViewController(LoginViewController.self)
        self.window?.makeKeyAndVisible()
        
        bind()
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Called as the scene is being released by the system.
        // This occurs shortly after the scene enters the background, or when its session is discarded.
        // Release any resources associated with this scene that can be re-created the next time the scene connects.
        // The scene may re-connect later, as its session was not necessarily discarded (see `application:didDiscardSceneSessions` instead).
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Called when the scene has moved from an inactive state to an active state.
        // Use this method to restart any tasks that were paused (or not yet started) when the scene was inactive.
    }

    func sceneWillResignActive(_ scene: UIScene) {
        // Called when the scene will move from an active state to an inactive state.
        // This may occur due to temporary interruptions (ex. an incoming phone call).
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        // Called as the scene transitions from the background to the foreground.
        // Use this method to undo the changes made on entering the background.
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Called as the scene transitions from the foreground to the background.
        // Use this method to save data, release shared resources, and store enough scene-specific state information
        // to restore the scene back to its current state.
    }
}

extension SceneDelegate {
    
    
    // Here we bind the async events of the various application controllers
    // against our UI layer
    
    func bind() {
        let app =  UIApplication.shared.delegate as! AppDelegate

        // Define our UI state as a function of the currenly logged in user
        app.userController.user
            .replaceError(with: nil)
            .receive(on: RunLoop.main)
            .sink { (user) in
                if (user == nil) {
                    let loginVC = self.createViewController(LoginViewController.self)
                    self.window?.rootViewController = loginVC
                }
                else {
                    let dialerVC = self.createViewController(DialerViewController.self)
                    self.nav = UINavigationController(rootViewController:dialerVC)
                    self.window?.rootViewController = self.nav
                }
            }
            .store(in: &cancellables)
        
        // Display Custom Call UI based on incoming call publisher
        app.userController.user
            .replaceError(with: nil)
            .combineLatest(app.callController.calls)
            .receive(on: RunLoop.main)
            .sink { (user, call) in
                guard user != nil else {
                    return
                }
                
                if (type(of:self.nav.topViewController) != ActiveCallViewController.self) {
                    let vc = ActiveCallViewController()

                    self.nav.pushViewController(vc, animated: true)
                    call
                        .receive(on: RunLoop.main)
                        .sink { call in
                            // Drive the Call UI state based on stream events from call
                            if vc.viewModel == nil {
                                let viewModel = ActiveCallViewModel(call: call)
                                viewModel.controller = app.callController
                                vc.viewModel = viewModel
                            }
                            else {
                                vc.viewModel?.call = call
                            }
                        }
                        .store(in: &self.cancellables)
                }
            }
            .store(in: &cancellables)
    }
}

// MARK: Factory

extension SceneDelegate {
    
    func createViewController(_ vc:UIViewController.Type) -> UIViewController {
        let app = UIApplication.shared.delegate as! AppDelegate

        switch(vc){
        case is LoginViewController.Type:
            let login = LoginViewController()
            let loginData = LoginViewModel()
            loginData.controller = app.userController
            login.viewModel = loginData
            return login
            
        case is DialerViewController.Type:
            let dialer = DialerViewController()
            let dialerData = DialerViewModel()
            dialerData.controller = app.callController
            dialer.viewModel = dialerData
            return dialer
            
        case is ActiveCallViewController.Type:
            let activeCall = ActiveCallViewController()
            return activeCall
        default:
            fatalError()
        }

    }
    
}


