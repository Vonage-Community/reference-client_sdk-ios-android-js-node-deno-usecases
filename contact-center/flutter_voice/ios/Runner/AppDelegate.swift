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


class CallClient: NSObject, VGVoiceClientDelegate {
    let channel: FlutterMethodChannel
    let client: VGVoiceClient
    
    init(_ binaryMessenger: FlutterBinaryMessenger) {
        VGVoiceClient.isUsingCallKit = false
        client = VGVoiceClient()
        channel = FlutterMethodChannel(name: "com.vonage.flutter_voice/client", binaryMessenger: binaryMessenger);
        super.init()
        channel.setMethodCallHandler { [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
            let args: [String: Any]? = call.arguments as? [String: Any]
            guard let self = self else { return }
            switch call.method {
                case "createSession": createSession(result, token: args?["token"] as? String)
                case "serverCall": serverCall(result, context: args?["context"] as? [AnyHashable : Any])
                case "hangup": hangup(result, callId: args?["callId"] as? String)
                case "mute": mute(result, callId: args?["callId"] as? String)
                case "unmute": unmute(result, callId: args?["callId"] as? String)
                case "disableEarmuff": disableEarmuff(result, callId: args?["callId"] as? String)
                case "enableEarmuff": enableEarmuff(result, callId: args?["callId"] as? String)
                default: result(FlutterMethodNotImplemented)
            }
        }
        client.delegate = self

    }
    
    // MARK: Client Methods

    func createSession(_ result: @escaping FlutterResult, token: String?) {
        guard token != nil else {
            result(FlutterError(code: "Bad Agrument", message: "Token was null", details: nil))
            return
        }
        
        client.createSession(token!, sessionId: nil) { err, sessionId in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(sessionId)
        }
    }
    
    func serverCall(_ result: @escaping FlutterResult, context: [AnyHashable : Any]?) {
        client.serverCall(context) { err, callId in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(callId)
        }
    }
    
    func hangup(_ result: @escaping FlutterResult, callId: String?) {
        guard callId != nil else {
            result(FlutterError(code: "Bad Agrument", message: "callId was null", details: nil))
            return
        }
        
        client.hangup(callId!) { err in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(nil)
        }
    }
    
    func mute(_ result: @escaping FlutterResult, callId: String?) {
        guard callId != nil else {
            result(FlutterError(code: "Bad Agrument", message: "callId was null", details: nil))
            return
        }
        
        client.mute(callId!) { err in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(nil)
        }
    }

    func unmute(_ result: @escaping FlutterResult, callId: String?) {
        guard callId != nil else {
            result(FlutterError(code: "Bad Agrument", message: "callId was null", details: nil))
            return
        }
        
        client.unmute(callId!) { err in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(nil)
        }
    }

    func disableEarmuff(_ result: @escaping FlutterResult, callId: String?) {
        guard callId != nil else {
            result(FlutterError(code: "Bad Agrument", message: "callId was null", details: nil))
            return
        }
        
        client.disableEarmuff(callId!) { err in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(nil)
        }
    }

    func enableEarmuff(_ result: @escaping FlutterResult, callId: String?) {
        guard callId != nil else {
            result(FlutterError(code: "Bad Agrument", message: "callId was null", details: nil))
            return
        }
        
        client.enableEarmuff(callId!) { err in
            guard err == nil else {
                result(FlutterError(code: "Exception", message: err?.localizedDescription, details: nil))
                return
            }
            result(nil)
        }
    }
    
    // MARK: Client Delegate methods
    
    func voiceClient(_ client: VGVoiceClient, didReceiveHangupForCall callId: VGCallId, withQuality callQuality: VGRTCQuality, reason: VGHangupReason) {
        CallEvent.onCallHangup(callId, callQuality: callQuality, reason: reason).send(channel)
    }
    func voiceClient(_ client: VGVoiceClient, didReceiveInviteCancelForCall callId: VGCallId, with reason: VGVoiceInviteCancelReason) {
        CallEvent.onCallInviteCancel(callId, reason: reason).send(channel)
    }
    func voiceClient(_ client: VGVoiceClient, didReceiveMuteForCall callId: VGCallId, withLegId legId: VGCallId, andStatus isMuted: Bool) {
        CallEvent.onMuted(callId, legId: legId, muted: isMuted).send(channel)
    }
    func voiceClient(_ client: VGVoiceClient, didReceiveEarmuffForCall callId: VGCallId, withLegId legId: VGCallId, andStatus earmuffStatus: Bool) {
        CallEvent.onEarmuff(callId, legId: legId, earmuffed: earmuffStatus).send(channel)
    }
    func client(_ client: VGBaseClient, didReceiveSessionErrorWith reason: VGSessionErrorReason) {}
    func voiceClient(_ client: VGVoiceClient, didReceiveInviteForCall callId: VGCallId, from caller: String, with type: VGVoiceChannelType) {}

}




protocol CallEventProtocol {
    var callId: String { get }
    func toMap() -> [String: Any]
}

enum CallEvent {
    case onCallHangup(_ callId: String, callQuality: VGRTCQuality, reason: VGHangupReason)
    case onMuted(_ callId: String, legId: String, muted: Bool)
    case onEarmuff(_ callId: String, legId: String, earmuffed: Bool)
    case onCallInviteCancel(_ callId: String, reason: VGVoiceInviteCancelReason)

    var callId: String {
        switch self {
        case .onCallHangup(let callId, _, _),
             .onMuted(let callId, _, _),
             .onEarmuff(let callId, _, _),
             .onCallInviteCancel(let callId, _):
            return callId
        }
    }

    func toMap() -> [String: Any] {
        switch self {
        case .onCallHangup(_, let callQuality, let reason):
            return ["callQuality": callQuality.description, "reason":mapVGHangupReason(reason)]
        case .onMuted(_, let legId, let muted):
            return ["legId": legId, "muted": muted]
        case .onEarmuff(_, let legId, let earmuffed):
            return ["legId": legId, "earmuffed": earmuffed]
        case .onCallInviteCancel(_, let reason):
            return ["reason": mapVGVoiceInviteCancelReason(reason)]
        }
    }
    
    func mapVGHangupReason(_ reason: VGHangupReason) -> String {
        switch(reason) {
          case .localHangup: 
            return "localHangup"
          case .remoteHangup: 
            return "remoteHangup"
        case .remoteReject:
            return "remoteReject"
        case .remoteNoAnswerTimeout:
            return "remoteNoAnswerTimeout"
        case .mediaTimeout:
            return "mediaTimeout"
        case .unknown:
            return "unknown"
        @unknown default:
            return "unknown"
        }
    }

    func mapVGVoiceInviteCancelReason(_ reason: VGVoiceInviteCancelReason) -> String {
        switch(reason) {
          case .remoteCancel: 
            return "remoteCancel"
        case .unknown:
            return "unknown"
        case .answeredElsewhere:
            return "answeredElsewhere"
        case .rejectedElsewhere:
            return "rejectedElsewhere"
        case .remoteTimeout:
            return "remoteTimeout"
        @unknown default:
            return "unknown"
        }
    }
    
    
}

// Extension to handle sending events
extension CallEvent {
    func send(_ channel: FlutterMethodChannel) {
        DispatchQueue.main.async {
            channel.invokeMethod(self.eventName, arguments: ["callId": self.callId, "data": self.toMap()])
        }
    }

    private var eventName: String {
        switch self {
        case .onCallHangup:
            return "onCallHangup"
        case .onMuted:
            return "onMuteUpdate"
        case .onEarmuff:
            return "onEarmuffUpdate"
        case .onCallInviteCancel:
            return "onCallInviteCancel"
        }
    }
}
