//
//  CallVisualView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Ashley Arthur on 14/04/2023.
//

import Foundation
import UIKit


enum CallVisualStatus {
    case ringing
    case answered
    case completed
}

class CallVisualView: UIButton {
    
    private var callStatusLabel: UILabel!
    private var callStatusVisual: UIView!
    private var callStatusVisualTop: UIView!
    
    func setCallState(_ s:CallVisualStatus) {
        switch(s) {
            case .ringing:
                self.callStatusVisual.backgroundColor = .systemGray
                self.callStatusVisualTop.backgroundColor = .black
                self.callStatusVisual.layer.add(CallVisualView.RingingAnimation, forKey: "ringing")
                self.callStatusLabel.text = "ringing"
            case .answered:
                self.callStatusVisual.layer.removeAnimation(forKey: "ringing")
                self.callStatusVisual.layer.add(CallVisualView.answerAnimation, forKey: "answer")
                self.callStatusVisual.backgroundColor = .systemGreen
                self.callStatusVisualTop.backgroundColor = .systemGreen
                self.callStatusLabel.text = "answered"
            case .completed :
                self.clearAnimation()
                self.callStatusVisual.backgroundColor = .systemGray
                self.callStatusVisualTop.backgroundColor = .systemGray
                self.callStatusLabel.text = "complete"
            }
    }
    
    // Private
    
    func clearAnimation() {
        CATransaction.begin()
        self.callStatusVisual.layer.removeAnimation(forKey: "answer")
        self.callStatusVisual.layer.removeAnimation(forKey: "ringing")
//        self.callStatusVisualTop.layer.removeAnimation(forKey: "rejected")
        CATransaction.commit()
    }
    
    override init(frame: CGRect) {
      super.init(frame: frame)
      setupView()
    }

    required init?(coder aDecoder: NSCoder) {
      super.init(coder: aDecoder)
      setupView()
    }
    
    private func setupView() {
        self.translatesAutoresizingMaskIntoConstraints = false
        
        callStatusLabel = UILabel()
        callStatusLabel.textAlignment = .center
        callStatusLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Animated Ringer
        callStatusVisual = UICustomRingView()
        callStatusVisual.backgroundColor = .systemGray2
        callStatusVisual.translatesAutoresizingMaskIntoConstraints = false

        // Core Ring
        callStatusVisualTop = UICustomRingView()
        callStatusVisualTop.backgroundColor = .black
        callStatusVisual.translatesAutoresizingMaskIntoConstraints = false

        addSubview(callStatusVisual)
        addSubview(callStatusVisualTop)
        addSubview(callStatusLabel)
        
        setupLayout()
    }
    
    private func setupLayout() {
        let callStatusVisualSize = 250.0 // TODO: make customiseable
        
        self.addConstraints([
            callStatusVisual.heightAnchor.constraint(equalToConstant: callStatusVisualSize),
            callStatusVisual.widthAnchor.constraint(equalToConstant: callStatusVisualSize),
            callStatusVisual.centerXAnchor.constraint(equalTo: self.centerXAnchor),
            callStatusVisual.centerYAnchor.constraint(equalTo: self.centerYAnchor),
    
            callStatusVisualTop.heightAnchor.constraint(equalToConstant: callStatusVisualSize),
            callStatusVisualTop.widthAnchor.constraint(equalToConstant: callStatusVisualSize),
            callStatusVisualTop.centerXAnchor.constraint(equalTo: self.centerXAnchor),
            callStatusVisualTop.centerYAnchor.constraint(equalTo: self.centerYAnchor),
    
            callStatusLabel.centerXAnchor.constraint(equalTo: self.centerXAnchor),
            callStatusLabel.centerYAnchor.constraint(equalTo: self.centerYAnchor)
        ])
        
        self.setNeedsUpdateConstraints()
    }
    
    override class var requiresConstraintBasedLayout: Bool {
        return true
    }
}


fileprivate extension CallVisualView{
    
    static let RingingAnimation: CAAnimation = { () -> CAAnimation in
        var anim = [CABasicAnimation]()
        let transformAnim = CABasicAnimation(keyPath: "transform.scale")
        transformAnim.duration = 2.0
        transformAnim.repeatCount = 200
        transformAnim.fromValue = 0.0
        transformAnim.toValue = 5.0
        transformAnim.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
        anim.append(transformAnim)
        
        let alphaAnim = CABasicAnimation(keyPath: #keyPath(CALayer.opacity))
        alphaAnim.duration = 2.0
        alphaAnim.repeatCount = 200
        alphaAnim.fromValue = [1.0]
        alphaAnim.toValue = [0.0]
        alphaAnim.fillMode = .forwards
        transformAnim.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
        
        anim.append(alphaAnim)
        
        let group = CAAnimationGroup()
        //        group.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
        group.animations = anim
        group.duration = 10.0
        group.repeatCount = 200
        
        return group
    }()
    
    
    static let answerAnimation: CAAnimation = { () -> CAAnimation in
        var anim = [CAAnimation]()
        let transformAnim = CAKeyframeAnimation(keyPath: "transform.scale")
        transformAnim.duration = 2
        transformAnim.repeatCount = 200
        transformAnim.values = [1.0, 1.1, 1.0]
        transformAnim.keyTimes = [0, 0.333, 1]
        transformAnim.timingFunctions = [
            CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeInEaseOut),
            CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeInEaseOut)
        ]
        anim.append(transformAnim)
        
        let group = CAAnimationGroup()
        group.animations = anim
        group.duration = 4
        group.repeatCount = 200
        
        return group
    }()
    
    
    static let RejectedAnimation: CAAnimation = { () -> CAAnimation in
        var anim = [CABasicAnimation]()
        
        let alphaAnim = CABasicAnimation(keyPath: #keyPath(CALayer.opacity))
        alphaAnim.duration = 0.5
        alphaAnim.repeatCount = 4
        alphaAnim.fromValue = [1.0]
        alphaAnim.toValue = [0.0]
        alphaAnim.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
        anim.append(alphaAnim)
        
        let group = CAAnimationGroup()
        group.animations = anim
        group.duration = 2
        group.repeatCount = 1
        
        return group
    }()
}
