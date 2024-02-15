package com.vonage.flutter_voice

import androidx.appcompat.app.AppCompatActivity
import dagger.Module
import dagger.hilt.EntryPoint
import dagger.hilt.EntryPoints
import dagger.hilt.InstallIn
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.components.ActivityComponent
import dagger.hilt.components.SingletonComponent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {

    @EntryPoint
    @InstallIn(SingletonComponent::class)
    interface CallClientEntryPoint {
        fun callClient(): CallClient
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        val callClient =  EntryPoints.get(this.applicationContext, CallClientEntryPoint::class.java).callClient()
        callClient.setBinaryMessenger(flutterEngine.dartExecutor.binaryMessenger)
    }
}
