import 'package:flutter/services.dart';
import 'package:flutter_voice/call_client/call_client_mixin.dart';

class CallClient with CallClientStub {
  static const platformChannel =
      MethodChannel('com.vonage.flutter_voice/client');

  CallClient() {
    platformChannel.setMethodCallHandler(methodCallHandler);
  }

  Future<dynamic> methodCallHandler(MethodCall call) async {
    switch (call.method) {
      case 'onCallHangup':
        handleEvent('onCallHangup', [
          call.arguments['callId'],
          call.arguments['data']['callQuality'],
          call.arguments['data']['reason']
        ]);
        break;
      case 'onCallInviteCancel':
        handleEvent('onCallInviteCancel',
            [call.arguments['callId'], call.arguments['data']['reason']]);
        break;
      case 'onMuteUpdate':
        handleEvent('onMuteUpdate', [
          call.arguments['callId'],
          call.arguments['data']['legId'],
          call.arguments['data']['muted']
        ]);
        break;
      case 'onEarmuffUpdate':
        handleEvent('onEarmuffUpdate', [
          call.arguments['callId'],
          call.arguments['data']['legId'],
          call.arguments['data']['earmuffed']
        ]);
        break;
      case 'onCallInvite':
        handleEvent('onCallInvite', [
          call.arguments['callId'],
          call.arguments['data']['from'],
          call.arguments['data']['channelType']
        ]);
        break;

      default:
        print('Unknowm method ${call.method}');
    }
  }

  @override
  Future<String?> getVonageJwt() async {
    try {
      final token = await platformChannel.invokeMethod<String?>(
        CallClientMethod.getVonageJwt.name,
      );
      return token;
    } on PlatformException catch (e) {
      print('Failed to get Vonage JWT: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<String> createSession(String token) async {
    try {
      final sessionId = await platformChannel.invokeMethod<String>(
        CallClientMethod.createSession.name,
        <String, dynamic>{'token': token},
      );
      return sessionId!;
    } on PlatformException catch (e) {
      print('Failed to create session: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> deleteSession() async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.deleteSession.name,
      );
    } on PlatformException catch (e) {
      print('Failed to delete session: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> refreshSession(String token) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.refreshSession.name,
        <String, dynamic>{'token': token},
      );
    } on PlatformException catch (e) {
      print('Failed to refresh session: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<String> serverCall(Map<String, String>? context) async {
    try {
      final callId = await platformChannel.invokeMethod<String>(
        CallClientMethod.serverCall.name,
        <String, dynamic>{'context': context},
      );
      return callId!;
    } on PlatformException catch (e) {
      print('Failed to create call: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> answer(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.answer.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to answer call: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> reject(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.reject.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to reject call: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> hangupCall(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.hangup.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to hangup: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> muteCall(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.mute.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to mute: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> unmuteCall(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.unmute.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to unmute: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> disableEarmuff(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.disableEarmuff.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to disable earmuff: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> enableEarmuff(String callId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.enableEarmuff.name,
        <String, dynamic>{'callId': callId},
      );
    } on PlatformException catch (e) {
      print('Failed to enable earmuff: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> enableAudio() async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.enableAudio.name,
      );
    } on PlatformException catch (e) {
      print('Failed to enable audio: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> disableAudio() async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.disableAudio.name,
      );
    } on PlatformException catch (e) {
      print('Failed to disable audio: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<String> registerPushToken() async {
    try {
      final token = await platformChannel.invokeMethod<String>(
          CallClientMethod.registerPushToken.name,
          <String, dynamic>{'isSandbox': true});
      return token!;
    } on PlatformException catch (e) {
      print('Failed to register push token: ${e.message}'); // use a logger here
      rethrow;
    }
  }

  @override
  Future<void> unregisterPushToken(String deviceId) async {
    try {
      await platformChannel.invokeMethod<void>(
        CallClientMethod.unregisterPushToken.name,
        <String, dynamic>{'deviceId': deviceId},
      );
    } on PlatformException catch (e) {
      print(
          'Failed to unregister push token: ${e.message}'); // use a logger here
      rethrow;
    }
  }
}
