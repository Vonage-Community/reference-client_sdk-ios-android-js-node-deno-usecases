//
//  ActiveCallViewController.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 29/01/2023.
//

import Foundation
import UIKit
import Combine
import CallKit


class ActiveCallViewModel: ObservableObject {
    @Published var call: Call
    
    var controller: CallController?
    
    private var cancellables = Set<AnyCancellable>()
    
    init(call:Call) {
        self.call = call
    }
    
    func modifyCall(action: CXAction) {
        controller?.reportCXAction(action)
    }
}

class ActiveCallViewController: UIViewController {
    var calleeLabel: UILabel!    
    var callVisual: CallVisualView!

    var answerButton: UIButton!
    var rejectButton: UIButton!
    var hangupButton: UIButton!
    var muteButton: UIButton!
    
    var inboundCallControls: UIView!
    var activeCallControls: UIView!
    var callControlRoot: UIStackView!
    
    var cancels = Set<AnyCancellable>()

    var viewModel:ActiveCallViewModel? {
        didSet(value) {
            if (self.isViewLoaded) { bind()}
        }
    }
    
    func isBound() -> Bool {
        return !cancels.isEmpty
    }
    
    func bind() {
        guard let viewModel else {
            return
        }
        _ = cancels.map { $0.cancel() }
        callVisual.clearAnimation()

        viewModel.$call.first()
            .map { (call) -> String in
                if case let .outbound(_,to,_) = call { return to }
                if case let .inbound(_,from,_) = call { return from }
                return ""
            }
            .receive(on: RunLoop.main)
            .sink(receiveValue: { (s:String) in
                self.calleeLabel.text = s
            })
            .store(in: &cancels)
        
        viewModel.$call
            .receive(on: RunLoop.main)
            .sink(receiveValue: { call in
                switch (call) {
                case .inbound(_,_, let status):
                    switch(status) {
                    case .ringing:
                        self.activeCallControls.removeFromSuperview()
                        self.callControlRoot.addArrangedSubview(self.inboundCallControls)
                    case .answered:
                        self.inboundCallControls.removeFromSuperview()
                        self.callControlRoot.addArrangedSubview(self.activeCallControls)
                    default:
                        return
                    }
                case .outbound:
                    self.inboundCallControls.removeFromSuperview()
                    self.callControlRoot.addArrangedSubview(self.activeCallControls)
                }
            })
            .store(in: &cancels)

        
        viewModel.$call
            .receive(on: RunLoop.main)
            .sink { call in
                switch(call.status) {
                case .ringing:
                    self.callVisual.setCallState(.ringing)
                case .answered:
                    self.callVisual.setCallState(.answered)
                case .completed:
                    self.callVisual.setCallState(.completed)
                    self.eventuallyDismiss()
                }
            }
            .store(in: &cancels)

    }

    func eventuallyDismiss() {
        Timer.publish(every: 1.5, on: RunLoop.main, in: .default).autoconnect().first().sink {  _ in
            if self.navigationController?.topViewController == self{
                self.navigationController?.popViewController(animated: true)
            }
        }.store(in: &self.cancels)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if (!self.isBound()){
            bind()
        }
    }
    
    override func loadView() {
        super.loadView()
        view = UIView()
        view.backgroundColor = .systemBackground
        
        calleeLabel = UILabel()
        calleeLabel.textAlignment = .center
        calleeLabel.font = UIFont.preferredFont(forTextStyle: .title1)
        
        callVisual = CallVisualView()
        
        answerButton = CircularButton()
        answerButton.translatesAutoresizingMaskIntoConstraints = false
        answerButton.setTitle("X", for: .normal)
        answerButton.backgroundColor = .green
        answerButton.addTarget(self, action: #selector(answerButtonPressed), for: .touchUpInside)
        
        rejectButton = CircularButton()
        rejectButton.translatesAutoresizingMaskIntoConstraints = false
        rejectButton.setTitle("X", for: .normal)
        rejectButton.backgroundColor = .systemRed
        rejectButton.addTarget(self, action: #selector(rejectedButtonPressed), for: .touchUpInside)
        
        hangupButton = CircularButton()
        hangupButton.setContentCompressionResistancePriority(.defaultHigh, for: .horizontal)
        hangupButton.setContentHuggingPriority(.defaultHigh, for: .horizontal)
        hangupButton.translatesAutoresizingMaskIntoConstraints = false
        hangupButton.setTitle("X", for: .normal)
        hangupButton.backgroundColor = .systemRed
        hangupButton.addTarget(self, action: #selector(hangupButtonPressed), for: .touchUpInside)
        
        muteButton = CircularButton()
        muteButton.backgroundColor = UIColor.systemGray
        muteButton.translatesAutoresizingMaskIntoConstraints = false
        muteButton.setTitle("X", for: .normal)
        muteButton.addTarget(self, action: #selector(hangupButtonPressed), for: .touchUpInside)
        
        let inboundCallControlStack = UIStackView()
        inboundCallControls = inboundCallControlStack
        inboundCallControls.translatesAutoresizingMaskIntoConstraints = false
        inboundCallControlStack.axis = .horizontal
        inboundCallControlStack.distribution = .equalCentering
        inboundCallControlStack.alignment = .center
        inboundCallControlStack.addArrangedSubview(answerButton)
        inboundCallControlStack.addArrangedSubview(rejectButton)

        let activeCallControlStack = UIStackView()
        activeCallControls = activeCallControlStack
        activeCallControls.translatesAutoresizingMaskIntoConstraints = false
        activeCallControlStack.axis = .horizontal
        activeCallControlStack.distribution = .equalCentering
        activeCallControlStack.alignment = .center
        activeCallControlStack.addArrangedSubview(UIView())
        activeCallControlStack.addArrangedSubview(hangupButton)
        activeCallControlStack.addArrangedSubview(UIView())
        
        let callControlRoot = UIStackView()
        self.callControlRoot = callControlRoot
        callControlRoot.translatesAutoresizingMaskIntoConstraints = false
        callControlRoot.axis = .vertical
        callControlRoot.distribution = .equalCentering
        callControlRoot.alignment = .fill


        let callControlButtonSize = 75.0
        let callControlConstraints = [
            hangupButton.heightAnchor.constraint(equalToConstant: callControlButtonSize),
            hangupButton.widthAnchor.constraint(equalToConstant: callControlButtonSize),
            muteButton.heightAnchor.constraint(equalToConstant: callControlButtonSize),
            muteButton.widthAnchor.constraint(equalToConstant: callControlButtonSize),
            answerButton.heightAnchor.constraint(equalToConstant: callControlButtonSize),
            answerButton.widthAnchor.constraint(equalToConstant: callControlButtonSize),
            rejectButton.heightAnchor.constraint(equalToConstant: callControlButtonSize),
            rejectButton.widthAnchor.constraint(equalToConstant: callControlButtonSize),
            
            callControlRoot.heightAnchor.constraint(greaterThanOrEqualToConstant: callControlButtonSize),
        ]

        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.distribution = .equalCentering
        stackView.alignment = .fill
        stackView.addArrangedSubview(calleeLabel)
        stackView.addArrangedSubview(callVisual)
        stackView.addArrangedSubview(callControlRoot)
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate(callControlConstraints + [
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.75),
            stackView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 50),
            stackView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -25)
        ])
    }
    
    @objc func hangupButtonPressed(_ sender:UIButton) {
        self.hangupButton.layer.add(ActiveCallViewController.ButtonPressedAnimation, forKey: "press")
        guard let call = viewModel?.call else {
            return
        }
        viewModel?.modifyCall(action: CXEndCallAction(call: call.id))
    }
    
    @objc func answerButtonPressed(_ sender:UIButton) {
        self.answerButton.layer.add(ActiveCallViewController.ButtonPressedAnimation, forKey: "press")
        guard let call = viewModel?.call else {
            return
        }
        viewModel?.modifyCall(action: CXAnswerCallAction(call: call.id))

    }
    
    @objc func rejectedButtonPressed(_ sender:UIButton) {
        guard let call = viewModel?.call else {
            return
        }
        self.rejectButton.layer.add(ActiveCallViewController.ButtonPressedAnimation, forKey: "press")
        viewModel?.modifyCall(action: CXEndCallAction(call: call.id))
    }
}

fileprivate extension ActiveCallViewController{
    
    static let ButtonPressedAnimation: CAAnimation = { () -> CAAnimation in
        var anim = [CAAnimation]()

        let transformAnim = CAKeyframeAnimation(keyPath: "transform.scale")
        transformAnim.duration = 0.2
        transformAnim.repeatCount = 1
        transformAnim.values = [1.0, 1.05, 1.0]
        transformAnim.keyTimes = [0, 0.333, 1]
        transformAnim.timingFunctions = [
            CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut),
            CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
        ]
        anim.append(transformAnim)
        
        let group = CAAnimationGroup()
        group.animations = anim
        group.duration = 0.5
        group.repeatCount = 1
        
        return group
    }()
}


