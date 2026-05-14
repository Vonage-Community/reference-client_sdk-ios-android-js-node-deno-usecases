//
//  TestWidgetExtensionBundle.swift
//  TestWidgetExtension
//
//  Created by Salvatore Di Cara on 13/04/2026.
//

import WidgetKit
import SwiftUI

@main
struct TestWidgetExtensionBundle: WidgetBundle {
    var body: some Widget {
        TestWidgetExtension()
        TestWidgetExtensionControl()
        TestWidgetExtensionLiveActivity()
    }
}
