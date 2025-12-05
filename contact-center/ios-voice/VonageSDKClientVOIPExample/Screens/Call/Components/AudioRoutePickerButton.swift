//
//  AudioRoutePickerButton.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 28/11/2025.
//

import SwiftUI
import AVKit

/// SwiftUI wrapper for AVRoutePickerView to show audio output options
/// Styled to match CallActionButton appearance
struct AudioRoutePickerButton: UIViewRepresentable {
    var size: CGFloat = 64
    var activeTintColor: Color = .white
    var backgroundColor: Color = .white.opacity(0.3)
    
    func makeUIView(context: Context) -> UIView {
        let container = UIView()
        container.backgroundColor = .clear
        
        // Background circle
        let backgroundView = UIView()
        backgroundView.backgroundColor = UIColor(backgroundColor)
        backgroundView.layer.cornerRadius = size / 2
        backgroundView.layer.shadowColor = UIColor.black.cgColor
        backgroundView.layer.shadowOpacity = 0.2
        backgroundView.layer.shadowOffset = CGSize(width: 0, height: 2)
        backgroundView.layer.shadowRadius = 4
        backgroundView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(backgroundView)
        
        // Route picker
        let picker = AVRoutePickerView()
        picker.activeTintColor = UIColor(activeTintColor)
        picker.tintColor = UIColor(activeTintColor)
        picker.prioritizesVideoDevices = false
        picker.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(picker)
        
        NSLayoutConstraint.activate([
            backgroundView.widthAnchor.constraint(equalToConstant: size),
            backgroundView.heightAnchor.constraint(equalToConstant: size),
            backgroundView.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            backgroundView.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            
            picker.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            picker.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            picker.widthAnchor.constraint(equalToConstant: size * 0.6),
            picker.heightAnchor.constraint(equalToConstant: size * 0.6)
        ])
        
        return container
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {}
}
