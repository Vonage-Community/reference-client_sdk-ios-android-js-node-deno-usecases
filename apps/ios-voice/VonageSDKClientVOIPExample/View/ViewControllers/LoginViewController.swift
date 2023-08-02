//
//  LoginViewController.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//

import Foundation
import UIKit
import Combine

enum LoginType: Int {
    case token, code
}

class LoginViewModel {
    @Published var user: Result<User,UserControllerErrors>? =  nil
    @Published var loginType: LoginType = .token
    @Published var error: Error?

    var cancellables = Set<AnyCancellable>()
    var controller:UserController? {
        didSet(value) {
            value != nil ? bind(controller: value!) : nil
        }
    }
    
    func login(username: String, password: String) {
        loginType == .token ?
        loginUser(username: username, token: password) :
        loginViaCode(username: username, code: password)
    }

    private func loginViaCode(username: String, code: String) {
        NetworkController()
            .sendRequest(apiType: CodeLoginAPI(body: LoginRequest(code: code)))
            .sink { completion in
                if case .failure(let error) = completion {
                    print(error)
                    self.error = error
                }
            } receiveValue: { (response: TokenResponse) in
                self.controller?.login(username: username,
                                       token: response.vonageToken,
                                       refreshToken: response.refreshToken)
            }.store(in: &cancellables)
    }

    private func loginUser(username: String, token: String) {
        controller?.login(username: username, token: token)
    }
    
    func bind(controller:UserController) {
        controller.user.compactMap{$0}.asResult().map { result in result.map { $0.0} }
        .assign(to: &self.$user)
    }
}


class LoginViewController: BaseViewController {
    
    var userNameInput: UITextField!
    var passwordInput: UITextField!
    var DescriptionView: UITextView!

    var submitButton: UIButton!
    var loginTypeSwitch: UISwitch!
    var loginTypeControl: UISegmentedControl!
    
    var viewModel: LoginViewModel? {
        didSet(value) {
            if (self.isViewLoaded) { bind()}
        }
    }
    
    var cancels = Set<AnyCancellable>()

    override func loadView() {
        super.loadView()
        view = UIView()
        view.backgroundColor = .white
        
        loginTypeControl = UISegmentedControl (items: ["Local Token","Server Auth"])
        loginTypeControl.addTarget(self, action: #selector(loginTypeChanged), for: .valueChanged)
        loginTypeControl.selectedSegmentIndex = 0
        loginTypeControl.setContentHuggingPriority(.defaultHigh, for: .vertical)

        userNameInput = UITextField()
        userNameInput.translatesAutoresizingMaskIntoConstraints = false
        userNameInput.placeholder = "Username"
        
        passwordInput = UITextField()
        passwordInput.translatesAutoresizingMaskIntoConstraints = false
        passwordInput.placeholder = "Password"
        
        DescriptionView = UITextView()
        DescriptionView.translatesAutoresizingMaskIntoConstraints = false
        
        submitButton = UIButton()
        submitButton.setTitle("Sign In", for: .normal)
        submitButton.backgroundColor = UIColor.black
        submitButton.addTarget(self, action: #selector(submitButtonPressed), for: .touchUpInside)
        submitButton.isEnabled = true
        
        let formContainerView = UIStackView()
        formContainerView.translatesAutoresizingMaskIntoConstraints = false
        formContainerView.axis = .vertical
        formContainerView.distribution = .equalSpacing
        formContainerView.alignment = .fill
        formContainerView.spacing = 20;
        formContainerView.setContentHuggingPriority(.defaultLow, for: .vertical)

        formContainerView.addArrangedSubview(userNameInput)
        formContainerView.addArrangedSubview(passwordInput)
        formContainerView.addArrangedSubview(submitButton)
        formContainerView.addArrangedSubview(UIView())
        formContainerView.addArrangedSubview(DescriptionView)

        let formContainerParentView = UIView()
        formContainerParentView.addSubview(formContainerView)

        
        let RootView = UIStackView()
        RootView.translatesAutoresizingMaskIntoConstraints = false
        RootView.axis = .vertical
        RootView.distribution = .fill
        RootView.alignment = .fill
        RootView.addArrangedSubview(loginTypeControl)
        RootView.addArrangedSubview(formContainerParentView)

        view.addSubview(RootView)
        
        NSLayoutConstraint.activate([
            RootView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 22.5),
            RootView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            RootView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            RootView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.8),
            
            formContainerView.widthAnchor.constraint(equalTo: formContainerParentView.widthAnchor),
            formContainerView.centerXAnchor.constraint(equalTo: formContainerParentView.centerXAnchor),
            formContainerView.centerYAnchor.constraint(equalTo: formContainerParentView.centerYAnchor),
            
            loginTypeControl.heightAnchor.constraint(equalToConstant: 45.0),
            userNameInput.heightAnchor.constraint(equalToConstant: 45.0),
            passwordInput.heightAnchor.constraint(equalToConstant: 45.0),
            submitButton.heightAnchor.constraint(equalToConstant: 45.0),
            DescriptionView.heightAnchor.constraint(equalToConstant: 150.0),
        ])
        
        viewModel?.$error
            .compactMap { $0?.localizedDescription }
            .receive(on: DispatchQueue.main)
            .assign(to: &($error))
        
        bind()
    }
    
    func bind() {
        
        guard let viewModel else {
            return
        }
        
        viewModel.$loginType.sink { auth_type in
            switch auth_type {
            case .code:
                self.DescriptionView.text = "NOTE: Applications with their own auth/login flow should generate a vonage JWT for the ios client on succesful login"
            case.token:
                self.DescriptionView.text = "NOTE: For testing purposes we can skip real login and use JWT from the config file"
            }
        }.store(in: &cancels)
    }
    
    @objc func loginTypeChanged(_ sender:UISegmentedControl!) {
        viewModel?.loginType = LoginType(rawValue: sender.selectedSegmentIndex)!

    }

    @objc func submitButtonPressed(_ sender:UIButton) {
        viewModel?.login(username: userNameInput.text ?? "", password: passwordInput.text ?? "")
    }
}
