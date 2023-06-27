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
    case code, token
}

class LoginViewModel {
    @Published var user: Result<User,UserControllerErrors>? =  nil
    
    var loginType: LoginType = .token
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
    var submitButton: UIButton!
    var loginTypeSwitch: UISwitch!
    
    var viewModel: LoginViewModel?

    override func loadView() {
        super.loadView()
        view = UIView()
        view.backgroundColor = .white
        
        userNameInput = UITextField()
        userNameInput.translatesAutoresizingMaskIntoConstraints = false
        userNameInput.placeholder = "Username"
        
        passwordInput = UITextField()
        passwordInput.translatesAutoresizingMaskIntoConstraints = false
        passwordInput.placeholder = "Vonage Token"
        passwordInput.text = Configuration.defaultToken
        
        submitButton = UIButton()
        submitButton.setTitle("submit", for: .normal)
        submitButton.backgroundColor = UIColor.black
        submitButton.addTarget(self, action: #selector(submitButtonPressed), for: .touchUpInside)
        submitButton.isEnabled = true
        
        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.distribution = .equalSpacing
        stackView.alignment = .fill
        stackView.spacing = 5;
        stackView.addArrangedSubview(userNameInput)
        stackView.addArrangedSubview(passwordInput)
        stackView.addArrangedSubview(loginTypeView())
        stackView.addArrangedSubview(submitButton)

        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.8),
            stackView.heightAnchor.constraint(equalToConstant: 200)
        ])
        
        viewModel?.$error
                .compactMap { $0?.localizedDescription }
                .receive(on: DispatchQueue.main)
                .assign(to: &($error))
    }
    
    private func loginTypeView() -> UIStackView {
        loginTypeSwitch = UISwitch(frame:CGRect(x: 150, y: 150, width: 0, height: 0))
        loginTypeSwitch.addTarget(self, action: #selector(self.loginTypeChanged(_:)), for: .valueChanged)
        loginTypeSwitch.onTintColor = .black

        let tokenLabel = UILabel()
        tokenLabel.text = "Token"
        tokenLabel.textColor = UIColor.black
        tokenLabel.font = .systemFont(ofSize: 13)

        let codeLabel = UILabel()
        codeLabel.textColor = UIColor.black
        codeLabel.font = .systemFont(ofSize: 13)
        codeLabel.text = "Code"

        let loginTypeLabel = UILabel()
        loginTypeLabel.text = "LoginType: "
        loginTypeLabel.textColor = UIColor.lightGray
        loginTypeLabel.font = .systemFont(ofSize: 13)
        loginTypeLabel.textAlignment = .left

        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .horizontal
        stackView.distribution = .fill
        stackView.alignment = .fill
        stackView.spacing = 5;
        stackView.addArrangedSubview(tokenLabel)
        stackView.addArrangedSubview(loginTypeSwitch)
        stackView.addArrangedSubview(codeLabel)

        let loginTypeView = UIStackView()
        loginTypeView.axis = .horizontal
        loginTypeView.translatesAutoresizingMaskIntoConstraints = false
        loginTypeView.spacing = 10
        loginTypeView.distribution = .equalSpacing
        loginTypeView.alignment = .fill
        loginTypeView.addArrangedSubview(loginTypeLabel)
        loginTypeView.addArrangedSubview(stackView)
        return loginTypeView
    }

    @objc func loginTypeChanged(_ sender:UISwitch!){
        viewModel?.loginType = sender.isOn ? .code : .token
        passwordInput.placeholder = sender.isOn ? "Login Code" : "Vonage Token"
        passwordInput.text = sender.isOn ? "" : Configuration.defaultToken
    }

    @objc func submitButtonPressed(_ sender:UIButton) {
        viewModel?.login(username: userNameInput.text ?? "", password: passwordInput.text ?? "")
    }
}
