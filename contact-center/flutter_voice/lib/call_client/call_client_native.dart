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
      default:
        print('Unknowm method ${call.method}');
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
}
