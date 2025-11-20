package com.example.vonage.voicesampleapp.core

import android.content.Context
import android.telecom.DisconnectCause
import android.telecom.TelecomManager
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.services.PushNotificationService
import com.example.vonage.voicesampleapp.telecom.CallConnection
import com.example.vonage.voicesampleapp.utils.*
import com.google.firebase.messaging.RemoteMessage
import com.vonage.android_core.PushType
import com.vonage.android_core.VGClientInitConfig
import com.vonage.clientcore.core.api.*
import com.vonage.clientcore.core.api.models.User
import com.vonage.clientcore.core.conversation.VoiceChannelType
import com.vonage.voice.api.VoiceClient
import java.lang.Exception
import androidx.core.net.toUri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * This Class will act as an interface
 * between the App and the Voice Client SDK
 */
class VoiceClientManager(private val context: Context) {
    private lateinit var client : VoiceClient
    private val coreContext = App.coreContext
    private val customRepository by lazy { CustomRepository() }
    
    private val _sessionId = MutableStateFlow<String?>(null)
    val sessionId: StateFlow<String?> = _sessionId.asStateFlow()
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()
    
    init {
        initClient()
        setClientListeners()
    }

    private fun initClient(){
        val config = VGClientInitConfig(LoggingLevel.Info)
        config.rtcStatsTelemetry = false
        client = VoiceClient(context, config)
    }

    private fun setClientListeners(){

        client.setSessionErrorListener { err ->
            val message = when(err){
                SessionErrorReason.TokenExpired -> "Token has expired"
                SessionErrorReason.TransportClosed -> "Connection closed"
                SessionErrorReason.PingTimeout -> "Connection timeout"
            }
            
            println("❌ Session error: $message")
            
            // Attempt restoration with appropriate strategy based on error type
            attemptSessionRestoration(skipAuthToken = err == SessionErrorReason.TokenExpired)
        }

        client.setCallInviteListener { callId, from, type ->
            println("📞 Incoming call from: $from")
            // Reject incoming calls when there is already an active one
            coreContext.activeCall.value?.let { return@setCallInviteListener }
            placeIncomingCall(callId, from, type)
            // NOTE: a foreground service needs to be started to record the audio when app is in the background
            startForegroundService(context)
        }

        client.setOnLegStatusUpdate { callId, legId, status ->
            println("🔄 Call status updated: $callId, status: $status")
            takeIfActive(callId)?.apply {
                if(status == LegStatus.answered){
                    setAnswered()
                }
            }
        }

        client.setOnCallHangupListener { callId, callQuality, reason ->
            println("📴 Call ended: $callId, reason: ${reason.name}")
            takeIfActive(callId)?.apply {
                val cause = when(reason) {
                    HangupReason.remoteReject -> DisconnectCause.REJECTED
                    HangupReason.remoteHangup -> DisconnectCause.REMOTE
                    HangupReason.localHangup -> DisconnectCause.LOCAL
                    HangupReason.mediaTimeout -> DisconnectCause.BUSY
                    HangupReason.remoteNoAnswerTimeout -> DisconnectCause.CANCELED
                }
                cleanUp(DisconnectCause(cause))
            }
        }

        client.setOnCallMediaDisconnectListener { callId, reason ->
            println("❌ Media disconnected - Call: $callId, Reason: ${reason.name}")
            takeIfActive(callId)?.apply {
                cleanUp(DisconnectCause(DisconnectCause.ERROR))
            }
        }
        
        client.setOnCallMediaReconnectingListener { callId ->
            println("🔄 Media reconnecting - Call: $callId")
            takeIfActive(callId)?.apply {
                setInitializing()
            }
        }

        client.setOnCallMediaReconnectionListener { callId ->
            println("✅ Media reconnected - Call: $callId")
            takeIfActive(callId)?.apply {
                setActive()
            }
        }

        client.setCallInviteCancelListener { callId, reason ->
            println("📴 Call invite cancelled: $callId, reason: ${reason.name}")
            takeIfActive(callId)?.apply {
                val cause = when(reason){
                    VoiceInviteCancelReason.AnsweredElsewhere -> DisconnectCause(DisconnectCause.ANSWERED_ELSEWHERE)
                    VoiceInviteCancelReason.RejectedElsewhere -> DisconnectCause(DisconnectCause.REJECTED)
                    VoiceInviteCancelReason.RemoteCancel -> DisconnectCause(DisconnectCause.CANCELED)
                    VoiceInviteCancelReason.RemoteTimeout -> DisconnectCause(DisconnectCause.MISSED)
                }
                cleanUp(cause)
            } ?: stopForegroundService(context)
        }

        client.setCallTransferListener { callId, conversationId ->
            println("🔀 Call transferred - Call: $callId, Conversation: $conversationId")
            takeIfActive(callId)?.apply {
                setAnswered()
            }
        }

        client.setOnMutedListener { callId, legId, isMuted ->
            println("🔇 Mute status changed - Call: $callId, Leg: $legId, Muted: $isMuted")
            val call = takeIfActive(callId) ?: return@setOnMutedListener
            // Only update our call state if this is for our own leg (callId == legId)
            takeIf { callId == legId } ?: return@setOnMutedListener
            if (call.isMuted.value != isMuted) {
                call.toggleMute()
            }
        }

        client.setOnDTMFListener { callId, legId, digits ->
            println("🔢 DTMF received - Call: $callId, Leg: $legId, Digits: '$digits'")
        }
    }
    fun login(token: String, isUserInitiated: Boolean = true, onErrorCallback: ((Exception) -> Unit)? = null, onSuccessCallback: ((String) -> Unit)? = null){
        if (isUserInitiated) {
            // Clean up any existing device registration before logging in (user-initiated login)
            unregisterExistingDeviceIfNeeded {
                createSession(token, onErrorCallback, onSuccessCallback)
            }
        } else {
            // Skip cleanup for session restoration (same user, just reconnecting)
            createSession(token, onErrorCallback, onSuccessCallback)
        }
    }

    /**
     * Creates a new session with the given token
     */
    private fun createSession(token: String, onErrorCallback: ((Exception) -> Unit)? = null, onSuccessCallback: ((String) -> Unit)? = null){
        client.createSession(token){ error, sessionId ->
            sessionId?.let { sid ->
                registerDevicePushToken()
                coreContext.authToken = token
                getCurrentUser {
                    reconnectCall()
                    // Set sessionId AFTER user is fetched and callback is invoked
                    // This ensures UI shows toast and username before navigation
                    onSuccessCallback?.invoke(sid)
                    _sessionId.value = sid
                }
            } ?: error?.let {
                onErrorCallback?.invoke(it)
            }
        }
    }

    private fun getCurrentUser(completionHandler: (() -> Unit)? = null){
        client.getUser("me"){ _, user ->
            _currentUser.value = user
            completionHandler?.invoke()
        }
    }

    fun loginWithCode(code: String, onErrorCallback: ((Exception) -> Unit)? = null, onSuccessCallback: ((String) -> Unit)? = null){
        customRepository.login(code){ err, res ->
            res?.let {
                coreContext.refreshToken = it.refreshToken
                this.login(it.vonageToken, true, onErrorCallback, onSuccessCallback)
            } ?: err?.let {
                onErrorCallback?.invoke(it)
            }
        }
    }

    fun logout(onSuccessCallback: (() -> Unit)? = null){
        // Always unregister push tokens on explicit logout
        // User won't receive calls after logging out
        unregisterDeviceToken {
            // Delete session
            client.deleteSession { error ->
                error?.let {
                    showToast(context, "Error Logging Out: ${error.message}")
                } ?: run {
                    // Clear state
                    clearSession()
                    onSuccessCallback?.invoke()
                }
            }
        }
    }

    // MARK: - Push Token Management

    /**
     * Unregisters the current device token if a device ID exists
     */
    private fun unregisterDeviceToken(completion: () -> Unit) {
        val deviceId = coreContext.deviceId ?: run {
            println("✅ No device ID to unregister")
            completion()
            return
        }

        client.unregisterDevicePushToken(deviceId) { error ->
            error?.let {
                println("❌ Failed to unregister push token: $it")
            } ?: run {
                println("✅ Push tokens unregistered for device: $deviceId")
            }

            // Clear deviceId regardless of success/failure
            coreContext.deviceId = null
            completion()
        }
    }

    /**
     * Unregisters any existing device before login to prevent token accumulation
     * This creates a temporary session with stored credentials if needed
     */
    private fun unregisterExistingDeviceIfNeeded(completion: () -> Unit) {
        // Check if we have a previously registered device
        val existingDeviceId = coreContext.deviceId ?: run {
            println("✅ No existing device ID - skipping cleanup")
            completion()
            return
        }

        // Check if we have a valid auth token to perform cleanup
        val authToken = coreContext.authToken ?: run {
            println("⚠️ No auth token for cleanup - clearing stale device ID $existingDeviceId")
            coreContext.deviceId = null
            completion()
            return
        }

        println("🧹 Cleaning up existing device: $existingDeviceId")

        // Create temporary session to unregister the old device
        client.createSession(authToken) { error, sessionId ->
            error?.let {
                println("⚠️ Cleanup session failed: ${error.message}")
                // Clear stale device ID and continue
                coreContext.deviceId = null
                completion()
                return@createSession
            }

            sessionId ?: run {
                println("⚠️ No session ID for cleanup")
                coreContext.deviceId = null
                completion()
                return@createSession
            }

            println("✅ Cleanup session created: $sessionId")

            // Unregister the old device using the reusable method
            unregisterDeviceToken {
                // Delete the cleanup session
                client.deleteSession { error ->
                    error?.let {
                        println("⚠️ Failed to delete cleanup session: ${it.message}")
                    } ?: run {
                        println("✅ Cleanup session deleted")
                    }
                    completion()
                }
            }
        }
    }

    // MARK: - Session Restoration

    /**
     * Restores session using stored credentials if no active session exists
     * Completion handler receives sessionId if successful, null otherwise
     */
    private fun restoreSessionIfNeeded(completion: (String?) -> Unit) {
        val currentSessionId = _sessionId.value
        currentSessionId?.let {
            println("✅ Active session exists: $it")
            completion(it)
            return
        }

        println("⚠️ No active session - attempting restoration")

        // Try auth token first, then refresh token
        val token = coreContext.authToken
        token?.let {
            restoreSessionWithToken(it, completion)
        } ?: run {
            val refreshToken = coreContext.refreshToken
            refreshToken?.let {
                restoreSessionWithRefreshToken(it, completion)
            } ?: run {
                println("⚠️ No stored credentials for session restoration")
                completion(null)
            }
        }
    }

    /**
     * Restores session using stored auth token
     */
    private fun restoreSessionWithToken(token: String, completion: (String?) -> Unit) {
        println("🔄 Restoring session with auth token")
        // Skip device cleanup - this is session restoration, not user switching
        login(
            token = token,
            isUserInitiated = false,
            onErrorCallback = { error ->
                println("❌ Failed to restore session: $error")
                completion(null)
            },
            onSuccessCallback = { sessionId ->
                println("✅ Session restored: $sessionId")
                completion(sessionId)
            }
        )
    }

    /**
     * Restores session by refreshing expired token
     */
    private fun restoreSessionWithRefreshToken(refreshToken: String, completion: (String?) -> Unit) {
        println("🔄 Refreshing expired token")

        customRepository.refresh(refreshToken) { error, response ->
            error?.let {
                println("❌ Token refresh failed: $it")
                completion(null)
                return@refresh
            }

            response?.let { tokenResponse ->
                // Update stored tokens
                coreContext.refreshToken = tokenResponse.refreshToken

                // Restore session with new token
                restoreSessionWithToken(tokenResponse.vonageToken, completion)
            } ?: run {
                println("❌ No response from token refresh")
                completion(null)
            }
        }
    }

    /**
     * Attempts session restoration with fallback logic
     */
    private fun attemptSessionRestoration(skipAuthToken: Boolean = false) {
        val handleFailure = {
            println("❌ All reconnection attempts failed - clearing session")
            clearSession()
            showToast(context, "Session expired - please log in again")
        }
        
        val fallbackToRefresh = {
            coreContext.refreshToken?.let { refreshToken ->
                restoreSessionWithRefreshToken(refreshToken) { sessionId ->
                    sessionId ?: handleFailure()
                }
            } ?: handleFailure()
        }
        
        if (!skipAuthToken) {
            coreContext.authToken?.let { token ->
                restoreSessionWithToken(token) { sessionId ->
                    sessionId ?: fallbackToRefresh()
                }
            } ?: fallbackToRefresh()
        } else {
            fallbackToRefresh()
        }
    }

    /**
     * Clears session state - generic method for reuse throughout the app
     */
    private fun clearSession() {
        _sessionId.value = null
        _currentUser.value = null
        coreContext.authToken = null
        coreContext.refreshToken = null
        coreContext.activeCall.value?.run {
            cleanUp(DisconnectCause(DisconnectCause.MISSED))
        }
    }

    // MARK: - Push Notifications

    /**
     * Processes VoIP push notification
     * Restores session if needed, then processes the incoming call invite
     */
    fun processVoipPush(remoteMessage: RemoteMessage) {
        println("📨 Processing VoIP push notification")

        // Restore session if needed
        // This will be needed to trigger the delegates for incoming call invites
        restoreSessionIfNeeded { sessionId ->
            sessionId ?: run {
                println("❌ Failed to restore session - cannot process incoming push")
                return@restoreSessionIfNeeded
            }
            // Process the push with active session
            processIncomingPush(remoteMessage)
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
                // NOTE: since API level 34, a foreground service needs to be started to record the audio also when app is in the foreground
                // https://developer.android.com/develop/connectivity/telecom/voip-app/telecom#foreground-support
                startForegroundService(context)
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
                    coreContext.activeCall.value ?:
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
                    println("❌ Failed to register push token: $err")
                } ?: deviceId?.let {
                    coreContext.deviceId = deviceId
                    println("✅ Registered push token with device ID: $deviceId")
                }
            }
        }
        coreContext.pushToken?.let {
            registerTokenCallback(it)
        } ?: PushNotificationService.requestToken {
            registerTokenCallback(it)
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
                    cleanUp(DisconnectCause(DisconnectCause.ERROR))
                } else {
                    println("Answered call with id: $callId")
                    setAnswered()
                }
            }
        } ?: call.selfDestroy()
    }

    fun rejectCall(call: CallConnection){
        call.takeIfActive()?.apply {
            client.reject(callId){ err ->
                if (err != null) {
                    println("Error Rejecting Call: $err")
                    cleanUp(DisconnectCause(DisconnectCause.ERROR))
                } else {
                    println("Rejected call with id: $callId")
                    cleanUp(DisconnectCause(DisconnectCause.REJECTED))
                }
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
                    cleanUp(DisconnectCause(DisconnectCause.LOCAL))
                } else {
                    println("Hung up call with id: $callId")
                    // The onCallHangupListener will be invoked with the reason
                }
            }
        } ?: call.selfDestroy()
    }

    fun muteCall(call: CallConnection){
        call.takeIfActive()?.apply {
            if (!isMuted.value) {
                client.mute(callId) { err ->
                    if (err != null) {
                        println("Error Muting Call: $err")
                    } else {
                        println("Muted call with id: $callId")
                        toggleMute()
                    }
                }
            }
        }
    }

    fun unmuteCall(call: CallConnection){
        call.takeIfActive()?.apply {
            if (isMuted.value) {
                client.unmute(callId) { err ->
                    if (err != null) {
                        println("Error Un-muting Call: $err")
                    } else {
                        println("Un-muted call with id: $callId")
                        toggleMute()
                    }
                }
            }
        }
    }

    fun enableNoiseSuppression(call: CallConnection){
        call.takeIfActive()?.apply {
            if (!isNoiseSuppressionEnabled.value) {
                client.enableNoiseSuppression(callId) { err ->
                    err?.let {
                        println("Error enabling noise suppression on Call: $it")
                    } ?: run {
                        println("Enabled noise suppression on Call with id: $callId")
                        toggleNoiseSuppression()
                    }
                }
            }
        }
    }

    fun disableNoiseSuppression(call: CallConnection){
        call.takeIfActive()?.apply {
            if (isNoiseSuppressionEnabled.value) {
                client.disableNoiseSuppression(callId) { err ->
                    err?.let {
                        println("Error disabling noise suppression on Call: $it")
                    } ?: run {
                        println("Disabled noise suppression on Call with id: $callId")
                        toggleNoiseSuppression()
                    }
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

    fun holdCall(call: CallConnection){
        call.takeIfActive()?.apply {
            if (!isOnHold.value) {
                client.enableEarmuff(callId) { error ->
                    error?.let {
                        println("Error enabling earmuff in holdCall with id: $callId")
                    } ?: run {
                        client.mute(callId) { error2 ->
                            error2?.let {
                                println("Error muting in holdCall with id: $callId")
                            } ?: run {
                                println("Call $callId successfully put on hold")
                                toggleHold()
                            }
                        }
                    }
                }
            }
        }
    }

    fun unholdCall(call: CallConnection){
        call.takeIfActive()?.apply {
            if (isOnHold.value) {
                client.unmute(callId) { error ->
                    error?.let {
                        println("Error unmuting in unholdCall with id: $callId")
                    } ?: run {
                        client.disableEarmuff(callId) { error2 ->
                            error2?.let {
                                println("Error disabling earmuff in unholdCall with id: $callId")
                            } ?: run {
                                println("Call $callId successfully removed from hold")
                                toggleHold()
                            }
                        }
                    }
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

    private fun placeIncomingCall(callId: CallId, caller: String, type: VoiceChannelType){
        try {
            coreContext.telecomHelper.startIncomingCall(callId, caller, type)
            // Navigate to MainActivity - it will observe active call and navigate to CallActivity
            navigateToMainActivity(context)
        } catch (e: Exception){
            abortInboundCall(callId, e.message)
        }
    }

    private fun abortOutboundCall(callId: CallId, message: String?){
        showToast(context, "Outgoing Call Error: $message")
        client.hangup(callId){}
        // Disconnect state is handled automatically through CallConnection StateFlow
    }

    private fun abortInboundCall(callId: CallId, message: String?){
        showToast(context, "Incoming Call Error: $message")
        client.reject(callId){}
        // Disconnect state is handled automatically through CallConnection StateFlow
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
            setAddress(to.toUri(), TelecomManager.PRESENTATION_ALLOWED)
            setCallerDisplayName(to, TelecomManager.PRESENTATION_ALLOWED)
            setDialing()
            if(isReconnected){ setAnswered() }
        }
        return connection
    }

    /*
     * Utilities to filter active calls
     */
    private fun takeIfActive(callId: CallId) : CallConnection? {
        return coreContext.activeCall.value?.takeIf { it.callId == callId }
    }
    private fun CallConnection.takeIfActive() : CallConnection? {
        return takeIfActive(callId)
    }

    private fun CallConnection.setAnswered(){
        // setActive() updates the connection state, which is observed via StateFlow
        this.setActive()
    }

    private fun CallConnection.cleanUp(disconnectCause: DisconnectCause){
        // disconnect() updates the connection state, which is observed via StateFlow
        this.disconnect(disconnectCause)
        stopForegroundService(context)
    }
}