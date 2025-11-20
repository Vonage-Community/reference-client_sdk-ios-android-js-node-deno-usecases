//
//  ErrorNotificationView.swift
//  VonageSDKClientVOIPExample
//
//  Created by Salvatore Di Cara on 20/11/2025.
//

import SwiftUI

struct ErrorNotificationView: View {
    let message: String
    let onDismiss: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)
            
            Text(message)
                .foregroundColor(.white)
                .font(.system(size: 14, weight: .medium))
                .multilineTextAlignment(.leading)
            
            Spacer()
            
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
                    .font(.system(size: 12, weight: .bold))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.red)
        .cornerRadius(8)
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .onTapGesture(perform: onDismiss)
    }
}
