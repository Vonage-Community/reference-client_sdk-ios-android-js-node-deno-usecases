import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_callkit_incoming/entities/entities.dart';
import 'package:flutter_voice/call_client/call_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';

class CallWidget extends StatefulWidget {
  @override
  _CallWidgetState createState() => _CallWidgetState();
}

enum CallStatus { none, ringing, connected, ended }

class _CallWidgetState extends State<CallWidget> {
  final CallClient _callClient = CallClient();

  String? _token = '';
  String? _sessionId;
  ({
    String id,
    CallStatus status,
    bool isMuted,
    bool isEarmuffed
  })? _currentCall;

  _CallWidgetState() {
    _callClient.getVonageJwt().then((value) {
      print('Vonage JWT: $value');
      if (value != null) {
        _createSession(value);
        // setState(() {
        // _token = value;
        // });
      }
    });
    _getNotificationPermission();
    _callClient.onCallHangup =
        (String callId, dynamic callQuality, String reason) async {
      print('Call hangup: $callId, $callQuality, $reason');
      if (_currentCall?.status == CallStatus.ended) return;
      setState(() {
        _currentCall = (
          id: callId,
          status: CallStatus.ended,
          isMuted: false,
          isEarmuffed: false
        );
      });
      // make sure callkit knows the call has ended
      await FlutterCallkitIncoming.endCall(callId);
    };

    _callClient.onCallInviteCancel = (String callId, String reason) async {
      print('Call invite cancel: $callId, $reason');
      if (_currentCall == null) return;
      setState(() {
        _currentCall = (
          id: callId,
          status: CallStatus.ended,
          isMuted: false,
          isEarmuffed: false
        );
      });
      await FlutterCallkitIncoming.endCall(callId);
    };

    _callClient.onMuteUpdate = (String callId, String legId, bool isMuted) {
      print('Mute update: $callId, $legId, $isMuted');
      if (_currentCall?.id != callId && callId != legId) return;
      setState(() {
        _currentCall = (
          id: callId,
          status: _currentCall!.status,
          isMuted: isMuted,
          isEarmuffed: _currentCall!.isEarmuffed
        );
      });
      FlutterCallkitIncoming.muteCall(callId, isMuted: isMuted);
    };

    _callClient.onEarmuffUpdate =
        (String callId, String legId, bool isEarmuffed) {
      print('Earmuff update: $callId, $legId, $isEarmuffed');
      // check its the current call and the local leg
      if (_currentCall?.id != callId && callId != legId) return;
      setState(() {
        _currentCall = (
          id: callId,
          status: _currentCall!.status,
          isMuted: _currentCall!.isMuted,
          isEarmuffed: isEarmuffed
        );
      });
    };

    FlutterCallkitIncoming.onEvent.listen((event) {
      if (event == null) return;
      switch (event.event) {
        case Event.actionCallToggleMute:
          String callId = event.body['id'];
          bool isMuted = event.body['isMuted'];
          // check if the call is connected and the mute status is different
          if (_currentCall?.status != CallStatus.connected ||
              _currentCall?.isMuted == isMuted) return;
          if (isMuted) {
            _callClient.muteCall(callId).then((value) => setState(() {
                  _currentCall = (
                    id: callId,
                    status: _currentCall!.status,
                    isMuted: true,
                    isEarmuffed: _currentCall!.isEarmuffed
                  );
                }));
          } else {
            _callClient.unmuteCall(callId).then((value) => setState(() {
                  _currentCall = (
                    id: callId,
                    status: _currentCall!.status,
                    isMuted: false,
                    isEarmuffed: _currentCall!.isEarmuffed
                  );
                }));
          }
          break;
        case Event.actionCallStart:
          String callId = event.body['id'];
          setState(() {
            _currentCall = (
              id: callId,
              status: CallStatus.connected,
              isMuted: false,
              isEarmuffed: false
            );
          });
          break;
        case Event.actionCallEnded:
          String callId = event.body['id'];
          if (_currentCall?.id != callId) return;
          if (_currentCall?.status != CallStatus.connected) return;
          _callClient.hangupCall(callId).then((value) => setState(() {
                _currentCall = (
                  id: callId,
                  status: CallStatus.ended,
                  isMuted: false,
                  isEarmuffed: false
                );
              }));
          break;
        case Event.actionCallIncoming:
          String callId = event.body['id'];
          setState(() {
            _currentCall = (
              id: callId,
              status: CallStatus.ringing,
              isMuted: false,
              isEarmuffed: false
            );
          });
          break;
        case Event.actionCallToggleAudioSession:
          bool isAudioActive = event.body['isActivate'];
          if (isAudioActive) {
            _callClient.enableAudio();
          } else {
            _callClient.disableAudio();
          }
          break;
        case Event.actionCallToggleHold:
        case Event.actionCallToggleDmtf:
          print(event);
          break;
        case Event.actionCallAccept:
          String callId = event.body['id'];
          if (_currentCall?.status != CallStatus.ringing) return;
          _callClient.answer(callId).then((value) => setState(() {
                _currentCall = (
                  id: callId,
                  status: CallStatus.connected,
                  isMuted: false,
                  isEarmuffed: false
                );
              }));
          break;
        case Event.actionCallDecline:
          String callId = event.body['id'];
          if (_currentCall?.status != CallStatus.ringing) return;
          _callClient.reject(callId).then((value) => setState(() {
                _currentCall = (
                  id: callId,
                  status: CallStatus.ended,
                  isMuted: false,
                  isEarmuffed: false
                );
              }));
          break;
        default:
          print('Unknown event: ${event.event}');
      }
    });
  }

  Future<void> _getNotificationPermission() async {
    try {
      var notificationPermission = await Permission.notification.request();
      if (notificationPermission.isGranted) {
        print('notificationPermission granted');
      } else {
        print('notificationPermission not granted');
        openAppSettings();
      }
    } catch (e) {
      print('Failed to get notification permission: ${e}'); // use a logger here
    }
  }

  Future<void> _createSession(String token) async {
    print('Creating session with token: $token');
    try {
      final sessionId = await _callClient.createSession(token);
      setState(() {
        _sessionId = sessionId;
      });
      if (Platform.isIOS || Platform.isAndroid) {
        print('Registering push token');
        final deviceId = await _callClient.registerPushToken();
        print('Registered device: $deviceId');
      }
    } catch (e) {
      print('Failed to create session: $e'); // use a logger here
    }
  }

  Future<void> _serverCall(Map<String, String>? context) async {
    try {
      var micPermission = await Permission.microphone.request();
      if (micPermission.isGranted) {
        final callId = await _callClient.serverCall(context);
        CallKitParams params = CallKitParams(
            id: callId,
            handle: 'Server Call',
            type: 0,
            extra: context,
            ios: const IOSParams(
                handleType: 'generic',
                supportsVideo: false,
                supportsHolding: false,
                supportsDTMF: false,
                supportsGrouping: false,
                supportsUngrouping: false,
                audioSessionMode: 'voiceChat'));
        await FlutterCallkitIncoming.startCall(params);
        await FlutterCallkitIncoming.setCallConnected(callId);
      } else {
        print('micPermission not granted');
        openAppSettings();
      }
    } catch (e) {
      print('Failed to create call: ${e}'); // use a logger here
    }
  }

  Future<void> _hangup() async {
    try {
      await FlutterCallkitIncoming.endCall(_currentCall!.id);
    } catch (e) {
      print('Failed to hangup: ${e}'); // use a logger here
    }
  }

  Future<void> _toggleMute() async {
    if (_currentCall?.status != CallStatus.connected) return;
    await FlutterCallkitIncoming.muteCall(_currentCall!.id,
        isMuted: !_currentCall!.isMuted);
  }

  List<Widget> _buildNoSession() {
    return [
      const Text('No session'),
      TextField(
        onChanged: (value) => _token = value,
        onSubmitted: (value) => _createSession(value),
        obscureText: true,
        keyboardType: TextInputType.visiblePassword,
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          labelText: 'Token',
          helperText: 'Enter a token',
          icon: const Icon(Icons.key),
          errorText: _token == null ? 'Please enter a token' : null,
        ),
      ),
      TextButton(
        onPressed: () => {
          if (_token != null)
            {_createSession(_token!)}
          else
            {print('Token is null')}
        },
        child: const Text('Create Session'),
      ),
    ];
  }

  List<Widget> _buildSessionCreated() {
    return [
      Text('Session created: $_sessionId'),
      TextButton(
        onPressed: () => _serverCall(null),
        child: const Text('Server Call'),
      ),
    ];
  }

  List<Widget> _buildCallInProgress() {
    return [
      const Text('Call in progress'),
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _hangup,
            icon: const Icon(Icons.call_end),
            color: Colors.red,
            tooltip: 'Hangup',
          ),
          IconButton(
            onPressed: _toggleMute,
            color: _currentCall!.isMuted ? Colors.red : null,
            icon: Icon(_currentCall!.isMuted ? Icons.mic_off : Icons.mic),
          ),
        ],
      )
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Center(
        child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (_sessionId == null) ..._buildNoSession(),
          if (_sessionId != null &&
              _currentCall?.status != CallStatus.connected)
            ..._buildSessionCreated(),
          if (_sessionId != null &&
              _currentCall?.status == CallStatus.connected)
            ..._buildCallInProgress(),
        ],
      ),
    ));
  }
}
