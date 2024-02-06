import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_callkit_incoming/entities/entities.dart';
import 'package:flutter_voice/call_client/call_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';
import 'package:uuid/uuid.dart';

Uuid uuid = const Uuid();

class CallWidget extends StatefulWidget {
  @override
  _CallWidgetState createState() => _CallWidgetState();
}

class _CallWidgetState extends State<CallWidget> {
  final CallClient _callClient = CallClient();

  String? _token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDMxNjIzNTYsImV4cCI6MTcwMzI0ODc1NiwiYXBwbGljYXRpb25faWQiOiI5NjFkZTZkZi05YzVlLTQ0NTgtYmI1NS04YTI2OTNiYjQxMTIiLCJqdGkiOiIxYzkwYTIzMi1jNzA3LTQ3MmMtYjUwYS1jNDUyYjhjMGRiYzMiLCJhY2wiOnsicGF0aHMiOnsiLyovdXNlcnMvKioiOnt9LCIvKi9jb252ZXJzYXRpb25zLyoqIjp7fSwiLyovc2Vzc2lvbnMvKioiOnt9LCIvKi9kZXZpY2VzLyoqIjp7fSwiLyovaW1hZ2UvKioiOnt9LCIvKi9tZWRpYS8qKiI6e30sIi8qL2FwcGxpY2F0aW9ucy8qKiI6e30sIi8qL3B1c2gvKioiOnt9LCIvKi9rbm9ja2luZy8qKiI6e30sIi8qL2xlZ3MvKioiOnt9fX0sInN1YiI6ImFsaWNlIn0.bDUpM267SdT3oUqc1P5uCQa3k6if1dFF6EqNB85lrPe30iq_pVgauWH_LJ4mdoTFyW9V8qkcnizqFNiUxNsB17LTo4d0UIvOfYKTgkNqhqLcs07RQgAft15oIGYwcJgwEqqjpvk1JV1SABucZMO5_hF2A54D6EKgwo7xdib8WAZKVwfv7sJGRAd3THX7OZXOvvMGmGUyYtn59o9PVQo5KDa7s-4irWp0zehgOi91ixUENTpJUUBiqdR-cDs_DtWYQV3kmI8aWmhXF_ofLJN0yW78Ve_cg9lQ4yr8zFR3vbv22KDfWmaXV1YbJBb9b_tXsOrkDAtnmp2Dz6A_G4inuQ';
  String? _sessionId;
  String? _callId;
  String? _callKituuid;

  bool _isMuted = false;
  bool _isEarmuffed = false;

  _CallWidgetState() {
    _getNotificationPermission();
    _callClient.onCallHangup =
        (String callId, dynamic callQuality, String reason) {
      print('Call hangup: $callId, $callQuality, $reason');
      setState(() {
        _callId = null;
      });
    };

    _callClient.onCallInviteCancel = (String callId, String reason) {
      print('Call invite cancel: $callId, $reason');
      setState(() {
        _callId = null;
      });
    };

    _callClient.onMuteUpdate = (String callId, String legId, bool isMuted) {
      print('Mute update: $callId, $legId, $isMuted');
      setState(() {
        _isMuted = isMuted;
      });
    };

    _callClient.onEarmuffUpdate =
        (String callId, String legId, bool isEarmuffed) {
      print('Earmuff update: $callId, $legId, $isEarmuffed');
      setState(() {
        _isEarmuffed = isEarmuffed;
      });
    };

    FlutterCallkitIncoming.onEvent.listen((event) {
      switch (event!.event) {
        case Event.actionCallToggleMute:
          _toggleMute();
          break;
        case Event.actionCallEnded:
          _callClient.hangupCall(_callId!);
          break;
        case Event.actionCallToggleAudioSession:
          bool isAudioActive = event.body['isActivate'];
          if (isAudioActive) {
            _callClient.enableAudio();
          } else {
            _callClient.disableAudio();
          }
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
    } on PlatformException catch (e) {
      print(
          'Failed to get notification permission: ${e.message}'); // use a logger here
    }
  }

  Future<void> _createSession(String token) async {
    try {
      final sessionId = await _callClient.createSession(token);
      if (Platform.isIOS || Platform.isAndroid) {
        final _deviceId = await _callClient.registerPushToken();
        print('Registered device: $_deviceId');
      }
      setState(() {
        _sessionId = sessionId;
      });
    } on PlatformException catch (e) {
      print('Failed to create session: ${e.message}'); // use a logger here
    }
  }

  Future<void> _serverCall(Map<String, String>? context) async {
    try {
      var micPermission = await Permission.microphone.request();
      if (micPermission.isGranted) {
        print('micPermission granted');
        _callKituuid = uuid.v4();
        CallKitParams params = CallKitParams(
            id: _callKituuid!,
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
        final callId = await _callClient.serverCall(context);
        await FlutterCallkitIncoming.setCallConnected(_callKituuid!);
        setState(() {
          _callId = callId;
        });
      } else {
        print('micPermission not granted');
        openAppSettings();
      }
    } on PlatformException catch (e) {
      await FlutterCallkitIncoming.endCall(_callKituuid!);
      print('Failed to create call: ${e.message}'); // use a logger here
    }
  }

  Future<void> _hangup() async {
    try {
      await FlutterCallkitIncoming.endCall(_callKituuid!);
    } on PlatformException catch (e) {
      print('Failed to hangup: ${e.message}'); // use a logger here
    }
  }

  Future<void> _toggleMute() async {
    try {
      if (_isMuted) {
        await _callClient.unmuteCall(_callId!);
      } else {
        await _callClient.muteCall(_callId!);
      }
      setState(() {
        _isMuted = !_isMuted;
      });
    } on PlatformException catch (e) {
      print('Failed to toggle mute: ${e.message}'); // use a logger here
    }
  }

  Future<void> _toggleEarmuff() async {
    try {
      if (_isEarmuffed) {
        await _callClient.disableEarmuff(_callId!);
      } else {
        await _callClient.enableEarmuff(_callId!);
      }
      setState(() {
        _isEarmuffed = !_isEarmuffed;
      });
    } on PlatformException catch (e) {
      print('Failed to toggle earmuff: ${e.message}'); // use a logger here
    }
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
            color: _isMuted ? Colors.red : null,
            icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
          ),
          IconButton(
            onPressed: _toggleEarmuff,
            color: _isEarmuffed ? Colors.red : null,
            icon: Icon(_isEarmuffed ? Icons.headset_off : Icons.headset),
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
          if (_sessionId != null && _callId == null) ..._buildSessionCreated(),
          if (_sessionId != null && _callId != null) ..._buildCallInProgress(),
        ],
      ),
    ));
  }
}
