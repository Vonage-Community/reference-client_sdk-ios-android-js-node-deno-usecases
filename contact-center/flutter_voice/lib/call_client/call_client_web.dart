// ignore_for_file: avoid_web_libraries_in_flutter

import 'package:js/js.dart';
import 'dart:js_util';

import 'call_client_mixin.dart';

@JS('vonageClientSDK.VonageClient')
@staticInterop
class VonageClient {
  external factory VonageClient();
}

extension on VonageClient {
  @JS('createSession')
  external dynamic _createSession(String token);

  Future<String> createSession(String token) async {
    return await promiseToFuture(_createSession(token));
  }

  @JS('serverCall')
  external dynamic _serverCall(Map<String, String>? context);

  Future<String> serverCall(Map<String, String>? context) async {
    return await promiseToFuture(_serverCall(context));
  }

  @JS('answer')
  external dynamic _answer(String callId);

  Future<void> answer(String callId) async {
    return await promiseToFuture(_answer(callId));
  }

  @JS('reject')
  external dynamic _reject(String callId);

  Future<void> reject(String callId) async {
    return await promiseToFuture(_reject(callId));
  }

  @JS('hangup')
  external dynamic _hangup(String callId);

  Future<void> hangup(String callId) async {
    return await promiseToFuture(_hangup(callId));
  }

  @JS('muteCall')
  external dynamic _mute(String callId);

  Future<void> mute(String callId) async {
    return await promiseToFuture(_mute(callId));
  }

  @JS('unmuteCall')
  external dynamic _unmute(String callId);

  Future<void> unmute(String callId) async {
    return await promiseToFuture(_unmute(callId));
  }

  @JS('disableEarmuff')
  external dynamic _disableEarmuff(String callId);

  Future<void> disableEarmuff(String callId) async {
    return await promiseToFuture(_disableEarmuff(callId));
  }

  @JS('enableEarmuff')
  external dynamic _enableEarmuff(String callId);

  Future<void> enableEarmuff(String callId) async {
    return await promiseToFuture(_enableEarmuff(callId));
  }

  @JS('on')
  external void _on(String event, Function callback);

  void on(String event, Function callback) {
    _on(event, allowInterop(callback));
  }
}

class CallClient with CallClientStub {
  final VonageClient _client = VonageClient();

  CallClient() {
    _client.on('callHangup',
        (String callId, dynamic callQuality, dynamic reason) {
      print('callHangup $callId $callQuality $reason');

      handleEvent(
          'onCallHangup', [callId, callQuality.toString(), reason.toString()]);
    });

    _client.on('callInviteCancel', (String callId, dynamic reason) {
      print('callInviteCancel $callId $reason');
      handleEvent('onCallInviteCancel', [callId, reason.toString()]);
    });

    _client.on('mute', (String callId, String legId, bool isMuted) {
      handleEvent('onMuteUpdate', [callId, legId, isMuted]);
    });

    _client.on('earmuff', (String callId, String legId, bool isEarmuffed) {
      handleEvent('onEarmuffUpdate', [callId, legId, isEarmuffed]);
    });

    _client.on('callInvite', (String callId, String from, String channelType) {
      handleEvent('onCallInvite', [callId, from, channelType]);
    });
  }

  @override
  Future<String> createSession(String token) {
    return _client.createSession(token);
  }

  @override
  Future<void> disableEarmuff(String callId) {
    return _client.disableEarmuff(callId);
  }

  @override
  Future<void> enableEarmuff(String callId) {
    return _client.enableEarmuff(callId);
  }

  @override
  Future<void> hangupCall(String callId) {
    return _client.hangup(callId);
  }

  @override
  Future<void> muteCall(String callId) {
    return _client.mute(callId);
  }

  @override
  Future<String> serverCall(Map<String, String>? context) {
    return _client.serverCall(context);
  }

  @override
  Future<void> answer(String callId) {
    return _client.answer(callId);
  }

  @override
  Future<void> reject(String callId) {
    return _client.reject(callId);
  }

  @override
  Future<void> unmuteCall(String callId) {
    return _client.unmute(callId);
  }

  /// Web doesn't support audio control
  @override
  Future<void> enableAudio() async {
    return;
  }

  /// Web doesn't support audio control
  @override
  Future<void> disableAudio() async {
    return;
  }
  
  @override
  Future<String> registerPushToken() async {
    print('registerPushToken not supported on web yet');
    return '';
  }

  @override
  Future<void> unregisterPushToken(String deviceId) async {
    print('unregisterPushToken not supported on web yet');
    return;
  }
}
