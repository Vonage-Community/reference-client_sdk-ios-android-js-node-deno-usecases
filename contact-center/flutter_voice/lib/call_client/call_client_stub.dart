import 'package:flutter_voice/call_client/call_client_mixin.dart';

// should never be used, but is required for conditional import to work
class CallClient with CallClientStub {
  CallClient() {
    throw UnimplementedError();
  }
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
