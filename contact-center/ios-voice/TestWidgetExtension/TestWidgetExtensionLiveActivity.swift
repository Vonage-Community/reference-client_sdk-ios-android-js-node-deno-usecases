//
//  TestWidgetExtensionLiveActivity.swift
//  TestWidgetExtension
//
//  Created by Salvatore Di Cara on 13/04/2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct TestWidgetExtensionLiveActivity: Widget {
    private func clampedProgress(_ progress: Double) -> Double {
        min(max(progress, 0.0), 1.0)
    }

    private func progressLabel(_ progress: Double) -> String {
        "\(Int((progress * 100).rounded()))%"
    }

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CallActivityAttributes.self) { context in
            let progress = clampedProgress(context.state.progress)
            let progressText = progressLabel(progress)

            // Lock screen/banner UI goes here
            VStack(alignment: .leading, spacing: 10) {
                Text("Call \(context.attributes.callId)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(progressText)
                        .font(.title2.monospacedDigit())
                        .fontWeight(.semibold)

                    Text("complete")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                ProgressView(value: progress, total: 1.0)
                    .tint(.black)
            }
            .padding()
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            let progress = clampedProgress(context.state.progress)
            let progressText = progressLabel(progress)

            return DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 6) {
                        Text(progressText)
                            .font(.headline.monospacedDigit())

                        ProgressView(value: progress, total: 1.0)
                    }
                    .padding(.horizontal, 8)
                }
            } compactLeading: {
                Text("📞")
            } compactTrailing: {
                Text(progressText)
                    .monospacedDigit()
            } minimal: {
                Text(progressText)
                    .monospacedDigit()
            }
        }
    }
}

#Preview("Notification", as: .content, using: CallActivityAttributes(callId: "test-123")) {
   TestWidgetExtensionLiveActivity()
} contentStates: {
    CallActivityAttributes.ContentState(progress: 1.0)
    CallActivityAttributes.ContentState(progress: 0.5)
}
