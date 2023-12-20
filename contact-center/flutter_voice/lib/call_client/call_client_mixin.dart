// CallWidget Stub

mixin CallClientStub {
  final Map<CallEvent, void Function(List<dynamic>)> _eventHandlers = {};

  Future<String> createSession(String token);
  Future<String> serverCall(Map<String, String>? context);
  Future<void> hangupCall(String callId);
  Future<void> muteCall(String callId);
  Future<void> unmuteCall(String callId);
  Future<void> disableEarmuff(String callId);
  Future<void> enableEarmuff(String callId);

  void handleEvent(String event, List<dynamic> args) {
    final callEvent = CallEvent.values.firstWhere(
      (e) => e.toString() == 'CallEvent.$event',
    );
    _eventHandlers[callEvent]?.call(args);
  }

  set onCallHangup(
      void Function(String callId, dynamic callQuality, String reason)
          callback) {
    _eventHandlers[CallEvent.onCallHangup] = (List<dynamic> args) {
      callback(args[0], args[1], args[2]);
    };
  }

  set onCallInviteCancel(void Function(String callId, String reason) callback) {
    _eventHandlers[CallEvent.onCallInviteCancel] = (List<dynamic> args) {
      callback(args[0], args[1]);
    };
  }

  set onMuteUpdate(
      void Function(String callId, String legId, bool isMuted) callback) {
    _eventHandlers[CallEvent.onMuteUpdate] = (List<dynamic> args) {
      callback(args[0], args[1], args[2]);
    };
  }

  set onEarmuffUpdate(
      void Function(String callId, String legId, bool isMuted) callback) {
    _eventHandlers[CallEvent.onEarmuffUpdate] = (List<dynamic> args) {
      callback(args[0], args[1], args[2]);
    };
  }
}

enum CallClientMethod {
  createSession,
  serverCall,
  hangup,
  mute,
  unmute,
  enableEarmuff,
  disableEarmuff
}

enum CallEvent {
  onCallHangup,
  onCallInviteCancel,
  onMuteUpdate,
  onEarmuffUpdate
}
