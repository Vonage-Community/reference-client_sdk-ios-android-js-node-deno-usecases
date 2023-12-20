package com.vonage.flutter_voice

import com.vonage.voice.api.VoiceClient
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private lateinit var callClient: CallClient
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        this.callClient = CallClient(this, flutterEngine.dartExecutor.binaryMessenger)
    }
}
