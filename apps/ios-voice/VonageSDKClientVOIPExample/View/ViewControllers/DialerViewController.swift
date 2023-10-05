//
//  DialerViewController.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 25/01/2023.
//

import UIKit
import Combine

enum callType: Int {
    case phone = 0, app = 1
}

class DialerViewModel: ObservableObject{
    @Published var callee: String = ""
    @Published var callType:callType = .phone
    @Published var connection: Connection = .connected
    
    var controller: CallController?
    var userController: UserController?
    
    func createOutboundCall(){
        // TODO: how to handle Errors?
        // via returned channel ?
        // if there is an username it will have the priority
        switch callType {
        case .app:
            let _ = controller?.startOutboundCall(["callee": self.callee, "callType": "app"])
        case .phone:
            let _ = controller?.startOutboundCall(["callee": self.callee, "callType": "phone"])
        }
    }
    
    func logout() {
        userController?.logout()
    }
    
}


// MARK: UI

class DialerViewController: UIViewController {
    var callButton: UIButton!
    var calleeNumberInput: UILabel!
    var calleUsernameInput: UITextField!
    var dialer: UIView!
    var dialerButtons: Array<UIButton> = []
    var deleteDigitButton: UIButton!
    var callTypeControl: UISegmentedControl!

    var onlineIcon: UIView!
    
    var viewModel: DialerViewModel? = nil
    var cancels = Set<AnyCancellable>()
    

    override func loadView() {
        super.loadView()
        view = UIView()
        view.backgroundColor = .white
        
        callTypeControl = UISegmentedControl (items: ["Phone number", "Username"])
        callTypeControl.addTarget(self, action: #selector(callTypeChanged), for: .valueChanged)
        callTypeControl.selectedSegmentIndex = 0
        callTypeControl.setContentHuggingPriority(.defaultHigh, for: .vertical)
        callTypeControl.selectedSegmentIndex = viewModel?.callType.rawValue ?? 0
        // MARK: ConnectionView

        let online = UIStackView()
        online.axis = .horizontal
        online.distribution = .fill
        online.alignment = .center
        online.spacing = 5
        online.setContentHuggingPriority(.defaultHigh, for: .vertical)
        online.setContentHuggingPriority(.defaultHigh, for: .horizontal)

        let onlineLabel = UILabel()
        onlineLabel.text = "Connection:"
        onlineIcon = UIButton()
        onlineIcon.backgroundColor = .systemRed
        onlineIcon.layer.cornerRadius = 10
        onlineIcon.clipsToBounds = true
        let onlineIconConstraints = [
            onlineIcon.widthAnchor.constraint(equalToConstant: 20.0),
            onlineIcon.heightAnchor.constraint(equalTo: onlineIcon.widthAnchor)
        ]
        online.addArrangedSubview(UIView()) // Spacer
        online.addArrangedSubview(onlineLabel)
        online.addArrangedSubview(onlineIcon)
        
        // MARK: Username Input Field
        calleUsernameInput = UITextField()
        calleUsernameInput.placeholder = "Enter Username"
        calleUsernameInput.borderStyle = .roundedRect
        calleUsernameInput.clearButtonMode = .always
        calleUsernameInput.autocorrectionType = .no
        calleUsernameInput.autocapitalizationType = .none
        calleUsernameInput.addTarget(self, action: #selector(usernameInputChanged), for: .editingChanged)
        calleUsernameInput.delegate = self
        calleUsernameInput.isHidden = callTypeControl.selectedSegmentIndex == 0

        // MARK: NumberView
        calleeNumberInput = UILabel()
        calleeNumberInput.text = ""
        calleeNumberInput.textAlignment = .center
        calleeNumberInput.font = UIFont.preferredFont(forTextStyle: .title2)
        
        deleteDigitButton = UIButton()
        deleteDigitButton.setTitle("<", for: .normal)
        deleteDigitButton.addTarget(self, action: #selector(deleteDigitButtonPressed), for: .touchUpInside)
        deleteDigitButton.backgroundColor = .black
        deleteDigitButton.layer.cornerRadius = 10
        deleteDigitButton.clipsToBounds = true
        
        let userInputStackView = UIStackView()
        userInputStackView.axis = .horizontal
        userInputStackView.distribution = .fill
        userInputStackView.alignment = .center
        userInputStackView.addArrangedSubview(calleeNumberInput)
        userInputStackView.addArrangedSubview(deleteDigitButton)

        // MARK: DialerView
        callButton = UIButton()
        callButton.setTitle("Call", for: .normal)
        callButton.addTarget(self, action: #selector(callButtonPressed), for: .touchUpInside)

        let dialer = DialerView()
        dialer.onClick = {
            self.viewModel?.callee += $0
        }
        self.dialer = dialer

        // MARK: RootView
        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.distribution = .fill
        stackView.alignment = .fill
        stackView.spacing = 10;
        stackView.addArrangedSubview(online)
        stackView.addArrangedSubview(callTypeControl)
        stackView.addArrangedSubview(calleUsernameInput)
        stackView.addArrangedSubview(userInputStackView)
        stackView.addArrangedSubview(UIView()) // spacer

        stackView.addArrangedSubview(dialer)
        stackView.addArrangedSubview(callButton)
        view.addSubview(stackView)

        NSLayoutConstraint.activate(onlineIconConstraints + [
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.75),
            stackView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 10),
            stackView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -25)
        ])
        navigationItem.leftBarButtonItem = UIBarButtonItem(title: "Logout", style: .plain, target: self, action: #selector(logoutButtonPressed(_:)))
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        guard let viewModel else {
            return
        }
        
        viewModel.$callee.sink { s in
            self.calleeNumberInput.text = s
            
            if(s != ""){
                self.deleteDigitButton.backgroundColor = .black
            }
            else {
                self.deleteDigitButton.backgroundColor = .systemBackground
            }
        }
        .store(in: &cancels)
        
        viewModel.$connection
            .receive(on: RunLoop.main)
            .sink { (connectionState) in
                switch (connectionState) {
                case .connected:
                    self.callButton.isEnabled = true
                    self.callButton.backgroundColor = UIColor.systemGreen
                    self.onlineIcon.backgroundColor = UIColor.systemGreen
                    
                #if targetEnvironment(simulator)
//                case .error(.PushNotRegistered):
//                    self.callButton.isEnabled = true
//                    self.callButton.backgroundColor = UIColor.systemGreen
//                    self.onlineIcon.backgroundColor = UIColor.systemGreen
                #endif
                    
                case .reconnecting:
                    self.callButton.isEnabled = true
                    self.onlineIcon.backgroundColor = UIColor.systemOrange
                    
                default:
                    self.callButton.isEnabled = false
                    self.callButton.backgroundColor = UIColor.systemGray
                    self.onlineIcon.backgroundColor = UIColor.red

                }
                self.onlineIcon.setNeedsDisplay()

        }
        .store(in: &cancels)
    }
    
    @objc func callTypeChanged(_ sender: UISegmentedControl?) {
        viewModel?.callee = ""
        viewModel?.callType = callType(rawValue: callTypeControl.selectedSegmentIndex) ?? .phone
        switch viewModel?.callType {
        case .app:
            dialer.isHidden = true
            calleeNumberInput.superview?.isHidden = true
            calleUsernameInput.isHidden = false
        case .none:
            fallthrough
        case .phone:
            dialer.isHidden = false
            calleUsernameInput.isHidden = true
            calleeNumberInput.superview?.isHidden = false
        }
    }
    
    @objc func callButtonPressed(_ sender:UIButton) {
        viewModel?.createOutboundCall()
    }
    
    @objc func deleteDigitButtonPressed(_ sender:UIButton) {
        _ = viewModel?.callee.popLast()
    }
    
    @objc func logoutButtonPressed(_ sender: UIBarItem!) {
        viewModel?.logout()
    }
    
    @objc func usernameInputChanged() {
        if let usernameText = calleUsernameInput.text {
            viewModel?.callee = usernameText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        }
    }

}

extension DialerViewController : UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        return true
    }
}


