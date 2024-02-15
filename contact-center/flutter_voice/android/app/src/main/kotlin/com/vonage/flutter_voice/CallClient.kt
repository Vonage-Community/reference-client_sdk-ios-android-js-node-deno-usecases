package com.vonage.flutter_voice

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService.MODE_PRIVATE
import com.vonage.android_core.VGClientConfig
import com.vonage.android_core.VGClientInitConfig
import com.vonage.android_core.VGConfigRegion
import com.vonage.clientcore.core.api.ClientConfig
import com.vonage.clientcore.core.api.LoggingLevel
import com.vonage.voice.api.VoiceClient
import dagger.Provides
import dagger.hilt.android.qualifiers.ApplicationContext
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodChannel
import javax.inject.Inject


class CallClient @Inject constructor (
    @ApplicationContext private val context: Context,
    private val vonagePreferences: VonagePreferences
) {


    val client = VoiceClient(context, VGClientInitConfig(
        loggingLevel =  LoggingLevel.Info,
        region =  VGConfigRegion.US,
    ));
    private lateinit var channel: MethodChannel

    companion object {
        const val CHANNEL_NAME = "com.vonage.flutter_voice/client"
    }

    fun setBinaryMessenger(value: BinaryMessenger) {
        channel = MethodChannel(value, CHANNEL_NAME)
        channel.setMethodCallHandler { call, result ->
            when (call.method) {
                "getVonageJwt" -> result.success(getVonageJwt())
                "createSession" -> createSession(result, call.argument("token")!!)
                "deleteSession" -> deleteSession(result)
                "refreshSession" -> refreshSession(result, call.argument("token")!!)
                "serverCall" -> serverCall(result, call.argument("context"))
                "answer" -> answer(result, call.argument("callId")!!)
                "reject" -> reject(result, call.argument("callId")!!)
                "hangup" -> hangup(result, call.argument("callId")!!)
                "mute" -> mute(result, call.argument("callId")!!)
                "unmute" -> unmute(result, call.argument("callId")!!)
                "disableEarmuff" -> disableEarmuff(result, call.argument("callId")!!)
                "enableEarmuff" -> enableEarmuff(result, call.argument("callId")!!)
                "enableAudio" -> result.success(null) // Not Needed on Android
                "disableAudio" -> result.success(null) // Not Needed on Android
                "registerPushToken" -> registerPushToken(result)
                "unregisterPushToken" -> unregisterPushToken(result, call.argument("deviceId")!!)
                else -> result.notImplemented()
            }
        }
        
        client.setOnCallHangupListener { callId, callQuality, reason ->
            CallEvent.OnCallHangup(callId, callQuality.toString(), reason.name)
                .send(channel)
        }

        client.setOnMutedListener { callId, legId, isMuted ->
            CallEvent.OnMuted(callId, legId, isMuted.toString())
                .send(channel)
        }

        client.setOnEarmuffListener { callId, legId, isEarmuffed ->
            CallEvent.OnEarmuff(callId, legId, isEarmuffed.toString())
                .send(channel)
        }

        client.setCallInviteCancelListener { callId, reason ->
            CallEvent.OnCallInviteCancel(callId, reason.name)
                .send(channel)
        }
    }

    sealed class CallEvent(private val name: String, private val callId: String) {
        class OnCallHangup(callId: String, private val callQuality: String, private val reason: String) : CallEvent("onCallHangup",
            callId) {
            override fun toMap() = mapOf("callQuality" to callQuality, "reason" to reason)
        }
        class OnMuted(callId: String, private val legId: String, private val muted: String) : CallEvent("onMuteUpdate", callId) {
            override fun toMap() = mapOf("legId" to legId, "muted" to muted)
        }
        class OnEarmuff(callId: String, private val legId: String, private val earmuffed: String) : CallEvent("onEarmuffUpdate", callId) {
            override fun toMap() = mapOf("legId" to legId, "earmuffed" to earmuffed)
        }

        class OnCallInviteCancel(callId: String, private val reason: String) : CallEvent("onCallInviteCancel", callId) {
            override fun toMap() = mapOf("reason" to reason)
        }

        abstract fun toMap(): Map<String, Any>
        fun send(channel: MethodChannel) {
            Handler(Looper.getMainLooper()).post {
                channel.invokeMethod(name, mapOf("callId" to callId, "data" to toMap()))
            }
        }
    }
    private fun getVonageJwt(): String? = vonagePreferences.vonageJwt

    private fun createSession(result: MethodChannel.Result, token: String) {
        client.createSession(token) { err, sessionId ->
            when {
                err == null && sessionId != null -> result.success(sessionId).also { vonagePreferences.vonageJwt = token }
                err is Exception -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun deleteSession(result: MethodChannel.Result) {
        client.deleteSession { err ->
            when (err) {
                null -> result.success(null).also { vonagePreferences.vonageJwt = null}
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun refreshSession(result: MethodChannel.Result, token: String) {
        client.refreshSession(token) { err ->
            when (err) {
                null -> result.success(null).also { vonagePreferences.vonageJwt = token }
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun serverCall(result: MethodChannel.Result, context: Map<String, String>? = null) {
        client.serverCall(context) { err, callId ->
            when {
                callId != null -> result.success(callId)
                err is Exception -> result.error("Exception", err.message, null)
                else -> result.error("Exception", "Unknown error", null) // should never happen
            }
        }
    }

    private fun answer(result: MethodChannel.Result, callId: String) {
        client.answer(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun reject(result: MethodChannel.Result, callId: String) {
        client.reject(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun hangup(result: MethodChannel.Result, callId: String) {
        client.hangup(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun mute(result: MethodChannel.Result, callId: String) {
        client.mute(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun unmute(result: MethodChannel.Result, callId: String) {
        client.unmute(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun disableEarmuff(result: MethodChannel.Result, callId: String) {
        client.disableEarmuff(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun enableEarmuff(result: MethodChannel.Result, callId: String) {
        client.enableEarmuff(callId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }

    private fun registerPushToken(result: MethodChannel.Result) {
        vonagePreferences.pushToken?.let { token ->
            client.registerDevicePushToken(token) { err, deviceId ->
                when (err) {
                    null -> result.success(deviceId)
                    else -> result.error("Exception", err.message, null)
                }
            }
        } ?: FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            vonagePreferences.pushToken = token
            client.registerDevicePushToken(token) { err, deviceId ->
                when (err) {
                    null -> result.success(deviceId)
                    else -> result.error("Exception", err.message, null)
                }
            }
        }
    }

    private fun unregisterPushToken(result: MethodChannel.Result, deviceId: String) {
        client.unregisterDevicePushToken(deviceId) { err ->
            when (err) {
                null -> result.success(null)
                else -> result.error("Exception", err.message, null)
            }
        }
    }


}