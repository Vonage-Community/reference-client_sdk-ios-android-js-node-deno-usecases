package com.vonage.flutter_voice

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.vonage.voice.api.VoiceClient
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodChannel


class CallClient(context: Context, binaryMessenger: BinaryMessenger) {
    private val channel = MethodChannel(binaryMessenger, "com.vonage.flutter_voice/client")
    private val client = VoiceClient(context);

    init {
        channel.setMethodCallHandler { call, result ->
            when (call.method) {
                "createSession" -> createSession(result, call.argument("token")!!)
                "serverCall" -> serverCall(result, call.argument("context"))
                "hangup" -> hangup(result, call.argument("callId")!!)
                "mute" -> mute(result, call.argument("callId")!!)
                "unmute" -> unmute(result, call.argument("callId")!!)
                "disableEarmuff" -> disableEarmuff(result, call.argument("callId")!!)
                "enableEarmuff" -> enableEarmuff(result, call.argument("callId")!!)
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


    private fun createSession(result: MethodChannel.Result, token: String) {
        client.createSession(token) { err, sessionId ->
            when {
                err == null && sessionId != null -> result.success(sessionId)
                err is Exception -> result.error("Exception", err.message, null)
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



}