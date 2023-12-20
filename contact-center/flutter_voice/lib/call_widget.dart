import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_voice/call_client/call_client.dart';
import 'package:permission_handler/permission_handler.dart';

class CallWidget extends StatefulWidget {
  @override
  _CallWidgetState createState() => _CallWidgetState();
}

class _CallWidgetState extends State<CallWidget> {
  final CallClient _callClient = CallClient();

  String? _token;
  String? _sessionId;
  String? _callId;

  bool _isMuted = false;
  bool _isEarmuffed = false;

  _CallWidgetState() {
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
  }

  Future<void> _createSession(String token) async {
    try {
      final sessionId = await _callClient.createSession(token);
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
        final callId = await _callClient.serverCall(context);
        setState(() {
          _callId = callId;
        });
      } else {
        print('micPermission not granted');
        openAppSettings();
      }
    } on PlatformException catch (e) {
      print('Failed to create call: ${e.message}'); // use a logger here
    }
  }

  Future<void> _hangup() async {
    try {
      await _callClient.hangupCall(_callId!);
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
