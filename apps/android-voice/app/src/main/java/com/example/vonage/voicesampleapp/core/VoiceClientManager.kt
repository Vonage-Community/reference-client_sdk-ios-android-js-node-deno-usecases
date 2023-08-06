package com.example.vonage.voicesampleapp.core

import android.content.Context
import android.net.Uri
import android.telecom.DisconnectCause
import android.telecom.TelecomManager
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.push.PushNotificationService
import com.example.vonage.voicesampleapp.telecom.CallConnection
import com.example.vonage.voicesampleapp.utils.*
import com.example.vonage.voicesampleapp.utils.notifyCallAnsweredToCallActivity
import com.example.vonage.voicesampleapp.utils.notifyCallDisconnectedToCallActivity
import com.example.vonage.voicesampleapp.utils.notifyIsMutedToCallActivity
import com.google.firebase.messaging.RemoteMessage
import com.vonage.android_core.PushType
import com.vonage.android_core.VGClientConfig
import com.vonage.clientcore.core.api.*
import com.vonage.clientcore.core.api.models.User
import com.vonage.clientcore.core.conversation.VoiceChannelType
import com.vonage.voice.api.VoiceClient
import java.lang.Exception

/**
 * This Class will act as an interface
 * between the App and the Voice Client SDK
 */
class VoiceClientManager(private val context: Context) {
    private lateinit var client : VoiceClient
    private val coreContext = App.coreContext
    private val customRepository by lazy { CustomRepository() }
    var sessionId: String? = null
        private set
    var currentUser: User? = null
        private set
    init {
        initClient()
        setClientListeners()
        registerNetworkCallback(context){
            // TODO: Call Reconnection on network switching
            //  is not currently supported by the SDK
            //  but it will soon be
            //reconnectCall()
        }
    }

    private fun initClient(){
        setDefaultLoggingLevel(LoggingLevel.Info)

        val config = VGClientConfig()

        client = VoiceClient(context)
        client.setConfig(config)
    }

    private fun setClientListeners(){

        client.setSessionErrorListener { err ->
            val message = when(err){
                SessionErrorReason.TokenExpired -> "Token has expired"
                SessionErrorReason.TransportClosed -> "Socket connection has been closed"
                SessionErrorReason.PingTimeout -> "Ping timeout"
            }
            showToast(context, "Session Error: $message")
            // When the Socket Connection is closed
            // Reset sessionId & current user
            sessionId = null
            currentUser = null
            // And try to log in again using last valid credentials
            val token = coreContext.authToken ?: return@setSessionErrorListener
            login(token,
                onErrorCallback = {
                    // Cleanup any active call upon login failure
                    coreContext.activeCall?.run {
                        disconnect(DisconnectCause(DisconnectCause.MISSED))
                        notifyCallDisconnectedToCallActivity(context, false)
                    } ?: navigateToMainActivity(context)
                }
            )
        }

        client.setCallInviteListener { callId, from, type ->
            // Reject incoming calls when there is already an active one
            coreContext.activeCall?.let { return@setCallInviteListener }
            if(isDeviceLocked(context)){
                coreContext.notificationManager.showIncomingCallNotification(callId, from, type)
            } else {
                placeIncomingCall(callId, from, type)
            }
        }

        client.setOnLegStatusUpdate { callId, legId, status ->
            println("Call $callId has received status update $status for leg $legId")
            takeIfActive(callId)?.apply {
                if(status == LegStatus.answered){
                    setActive()
                    notifyCallAnsweredToCallActivity(context)
                }
            }
        }

        client.setOnCallHangupListener { callId, callQuality, reason ->
            println("Call $callId has been hung up with reason: ${reason.name} and quality: $callQuality")
            takeIfActive(callId)?.apply {
                val (cause, isRemote) = when(reason) {
                    HangupReason.remoteReject -> DisconnectCause.REJECTED to true
                    HangupReason.remoteHangup -> DisconnectCause.REMOTE to true
                    HangupReason.localHangup -> DisconnectCause.LOCAL to false
                    HangupReason.mediaTimeout -> DisconnectCause.BUSY to true
                    HangupReason.remoteNoAnswerTimeout -> DisconnectCause.CANCELED to true
                }
                disconnect(DisconnectCause(cause))
                notifyCallDisconnectedToCallActivity(context, isRemote)
            }
        }

        client.setCallInviteCancelListener { callId, reason ->
            println("Invite to Call $callId has been canceled with reason: ${reason.name}")
            takeIfActive(callId)?.apply {
                val cause = when(reason){
                    VoiceInviteCancelReason.AnsweredElsewhere -> DisconnectCause(DisconnectCause.ANSWERED_ELSEWHERE)
                    VoiceInviteCancelReason.RejectedElsewhere -> DisconnectCause(DisconnectCause.REJECTED)
                    VoiceInviteCancelReason.RemoteCancel -> DisconnectCause(DisconnectCause.CANCELED)
                    VoiceInviteCancelReason.RemoteTimeout -> DisconnectCause(DisconnectCause.MISSED)
                }
                disconnect(cause)
                notifyCallDisconnectedToCallActivity(context, true)
            } ?: coreContext.notificationManager.dismissIncomingCallNotification(callId)
        }

        client.setCallTransferListener { callId, conversationId ->
            println("Call $callId has been transferred to conversation $conversationId")
        }

        client.setOnMutedListener { callId, legId, isMuted ->
            println("LegId $legId for Call $callId has been ${if(isMuted) "muted" else "unmuted"}")
            takeIf { callId == legId } ?: return@setOnMutedListener
            // Update Active Call Mute State
            takeIfActive(callId)?.isMuted = isMuted
            // Notify Call Activity
            notifyIsMutedToCallActivity(context, isMuted)
        }

        client.setOnDTMFListener { callId, legId, digits ->
            println("LegId $legId has sent DTMF digits '$digits' to Call $callId")
        }
    }
    fun login(token: String, onErrorCallback: ((Exception) -> Unit)? = null, onSuccessCallback: ((String) -> Unit)? = null){
        client.createSession(token){ error, sessionId ->
            sessionId?.let {
                registerDevicePushToken()
                this.sessionId = it
                coreContext.authToken = token
                getCurrentUser {
                    reconnectCall()
                    onSuccessCallback?.invoke(it)
                }
            } ?: error?.let {
                onErrorCallback?.invoke(it)
            }
        }
    }

    private fun getCurrentUser(completionHandler: (() -> Unit)? = null){
        client.getUser("me"){ _, user ->
            currentUser = user
            completionHandler?.invoke()
        }
    }

    fun loginWithCode(code: String, onErrorCallback: ((Exception) -> Unit)? = null, onSuccessCallback: ((String) -> Unit)? = null){
        customRepository.login(code){ err, res ->
            res?.let {
                coreContext.refreshToken = it.refreshToken
                this.login(it.vonageToken, onErrorCallback, onSuccessCallback)
            } ?: err?.let {
                onErrorCallback?.invoke(it)
            }
        }
    }

    fun logout(onSuccessCallback: (() -> Unit)? = null){
        unregisterDevicePushToken()
        client.deleteSession { error ->
            error?.let {
                showToast(context, "Error Logging Out: ${error.message}")
            } ?: run {
                sessionId = null
                currentUser = null
                coreContext.authToken = null
                coreContext.refreshToken = null
                onSuccessCallback?.invoke()
            }
        }
    }

    fun startOutboundCall(callContext: Map<String, String>? = null){
        client.serverCall(callContext) { err, callId ->
            err?.let {
                println("Error starting outbound call: $it")
            } ?: callId?.let {
                println("Outbound Call successfully started with Call ID: $it")
                val callee = callContext?.get(Constants.CONTEXT_KEY_CALLEE) ?: Constants.DEFAULT_DIALED_NUMBER
                placeOutgoingCall(it, callee)
            }
        }
    }

    private fun reconnectCall(){
        coreContext.lastActiveCall?.run {
            client.reconnectCall(this.callId){ err ->
                err?.let {
                    showToast(context, "Error reconnecting call with $callerDisplayName: $it")
                } ?: run {
                    showToast(context, "Call with $callerDisplayName successfully reconnected")
                    coreContext.activeCall ?:
                    // Start a new Outgoing Call if there is not an active one
                    placeOutgoingCall(this.callId, this.callerDisplayName, isReconnected = true)
                }
            }
        }
    }

    private fun registerDevicePushToken(){
        val registerTokenCallback : (String) -> Unit = { token ->
            client.registerDevicePushToken(token) { err, deviceId ->
                err?.let {
                    println("Error in registering Device Push Token: $err")
                } ?: deviceId?.let {
                    coreContext.deviceId = deviceId
                    println("Device Push Token successfully registered with Device ID: $deviceId")
                }
            }
        }
        coreContext.pushToken?.let {
            registerTokenCallback(it)
        } ?: PushNotificationService.requestToken {
            registerTokenCallback(it)
        }
    }

    private fun unregisterDevicePushToken(){
        coreContext.deviceId?.let {
            client.unregisterDevicePushToken(it) { err ->
                err?.let {
                    println("Error in unregistering Device Push Token: $err")
                }
            }
        }
    }

    fun processIncomingPush(remoteMessage: RemoteMessage) {
        val dataString = remoteMessage.data.toString()
        val type: PushType = VoiceClient.getPushNotificationType(dataString)
        if (type == PushType.INCOMING_CALL) {
            // This method will trigger the Client's Call Invite Listener
            client.processPushCallInvite(dataString)
        }
    }

    fun answerCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.answer(callId) { err ->
                if (err != null) {
                    println("Error Answering Call: $err")
                    disconnect(DisconnectCause(DisconnectCause.ERROR))
                    notifyCallDisconnectedToCallActivity(context, false)
                } else {
                    println("Answered call with id: $callId")
                    setActive()
                    notifyCallAnsweredToCallActivity(context)
                }
            }
        } ?: call.selfDestroy()
    }

    fun rejectCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.reject(callId){ err ->
                if (err != null) {
                    println("Error Rejecting Call: $err")
                    disconnect(DisconnectCause(DisconnectCause.ERROR))
                } else {
                    println("Rejected call with id: $callId")
                    disconnect(DisconnectCause(DisconnectCause.REJECTED))
                }
                notifyCallDisconnectedToCallActivity(context, false)
            }
        } ?: call.selfDestroy()
    }

    fun hangupCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.hangup(callId) { err ->
                if (err != null) {
                    println("Error Hanging Up Call: $err")
                    // If there has been an error
                    // the onCallHangupListener will not be invoked,
                    // hence the Call needs to be explicitly disconnected
                    disconnect(DisconnectCause(DisconnectCause.LOCAL))
                    notifyCallDisconnectedToCallActivity(context, false)
                } else {
                    println("Hung up call with id: $callId")
                }
            }
        } ?: call.selfDestroy()
    }

    fun muteCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.mute(callId) { err ->
                if (err != null) {
                    println("Error Muting Call: $err")
                } else {
                    println("Muted call with id: $callId")
                }
            }
        }
    }

    fun unmuteCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.unmute(callId) { err ->
                if (err != null) {
                    println("Error Un-muting Call: $err")
                } else {
                    println("Un-muted call with id: $callId")
                }
            }
        }
    }

    fun sendDtmf(call: CallConnection, digit: String){
        call.takeIfActive()?.apply {
            client.sendDTMF(callId, digit){ err ->
                if (err != null) {
                    println("Error in Sending DTMF '$digit': $err")
                } else {
                    println("Sent DTMF '$digit' on call with id: $callId")
                }
            }
        }
    }

    /*
     * Utilities to handle errors on telecomHelper
     */
    private fun placeOutgoingCall(callId:CallId, callee: String, isReconnected:Boolean = false){
        try {
            coreContext.telecomHelper.startOutgoingCall(callId, callee, isReconnected)
            // If ConnectionService does not respond within 3 seconds
            // then mock an outgoing connection
            TimerManager.startTimer(TimerManager.CONNECTION_SERVICE_TIMER, 3000){
                mockOutgoingConnection(callId, callee, isReconnected)
            }
        } catch (e: Exception){
            abortOutboundCall(callId, e.message)
        }
    }

    fun placeIncomingCall(callId: CallId, caller: String, type: VoiceChannelType){
        try {
            coreContext.telecomHelper.startIncomingCall(callId, caller, type)
        } catch (e: Exception){
            abortInboundCall(callId, e.message)
        }
    }

    private fun abortOutboundCall(callId: CallId, message: String?){
        showToast(context, "Outgoing Call Error: $message")
        client.hangup(callId){}
        notifyCallDisconnectedToCallActivity(context, false)
    }

    private fun abortInboundCall(callId: CallId, message: String?){
        showToast(context, "Incoming Call Error: $message")
        client.reject(callId){}
        notifyCallDisconnectedToCallActivity(context, false)
    }

    /**
     *  ConnectionService not working on some devices (e.g. Samsung)
     *  is a known issue.
     *
     *  This method will mock
     *  `ConnectionService#onCreateOutgoingConnection`
     *  and allow outgoing calls without interacting with the Telecom framework.
     */
    private fun mockOutgoingConnection(callId: CallId, to: String, isReconnected: Boolean) : CallConnection {
        showToast(context, "ConnectionService Not Available")
        val connection = CallConnection(callId).apply {
            setAddress(Uri.parse(to), TelecomManager.PRESENTATION_ALLOWED)
            setCallerDisplayName(to, TelecomManager.PRESENTATION_ALLOWED)
            setDialing()
            if(isReconnected){ setActive() }
        }
        return connection
    }

    /*
     * Utilities to filter active calls
     */
    private fun takeIfActive(callId: CallId) : CallConnection? {
        return coreContext.activeCall?.takeIf { it.callId == callId }
    }
    private fun CallConnection.takeIfActive() : CallConnection? {
        return takeIfActive(callId)
    }
}