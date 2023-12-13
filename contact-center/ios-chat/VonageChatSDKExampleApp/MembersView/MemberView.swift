//
//  MemberView.swift
//  VonageChatSDKExampleApp
//
//  Created by Mehboob Alam on 07.06.23.
//

import SwiftUI

struct MemberView: View {
    @StateObject private var viewModel: MemberViewModel
    @Environment(\.presentationMode) var presentation
    
    init(viewModel: MemberViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        HStack {
            if let url = URL(string: viewModel.imageURL) {
                AsyncImage(url: url){ image in
                    image.image?
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(idealWidth: 50, maxWidth: 50, idealHeight: 50, maxHeight: 50)
                        .cornerRadius(25)
                }
            }
            VStack {
                let member = viewModel.member
                Text(viewModel.name)
                    .bold()
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: 5) {
                    let state = member.state
                    let color: Color = switch(state){
                    case .invited:
                        .yellow
                    case .joined:
                        .green
                    case .left:
                        .red
                    default:
                        .gray
                    }
                    Text(state.description)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .foregroundColor(color)
                        .font(.caption)
                    Text("Channel: \(member.channel?.type.description ?? "N/A")")
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .font(.caption)
                }

            }
        }
    }
}
