import UIKit
import Flutter

import VonageClientSDKVoice

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  var client: CallClient?
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
      GeneratedPluginRegistrant.register(with: self)
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    client = CallClient(controller.binaryMessenger)
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

