package com.example.vonage.voicesampleapp.core

import android.content.Context
import android.telecom.DisconnectCause
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.services.PushNotificationService
import com.example.vonage.voicesampleapp.telecom.CallManager
import com.example.vonage.voicesampleapp.telecom.CallService
import com.example.vonage.voicesampleapp.utils.*
import com.google.firebase.messaging.RemoteMessage
import com.vonage.android_core.PushType
import com.vonage.android_core.VGClientInitConfig
import com.vonage.clientcore.core.api.*
import com.vonage.clientcore.core.api.models.User
import com.vonage.clientcore.core.conversation.VoiceChannelType
import com.vonage.voice.api.CallId
import com.vonage.voice.api.VoiceClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.lang.Exception

/**
 * The interface between the app and the Vonage Voice Client SDK.
 *
 * It is the single source of truth for the in-progress call: SDK callbacks and
 * user actions update [CoreContext.activeCall], which the UI and the call
 * notification observe. OS-side call integration (foreground priority, audio,
 * system answer/mute) is delegated to [CallManager] (Jetpack Core-Telecom).
 */
class VoiceClientManager(private val context: Context) {
    private lateinit var client : VoiceClient
    private val coreContext = App.coreContext
    private val customRepository by lazy { CustomRepository() }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    /** Core-Telecom bridge. Fire-and-forget: it never writes back into call state. */
    private val telecom = CallManager(
        context,
        onTelecomAnswer = { answerCall() },
        onTelecomDisconnect = { hangupCall() },
        onMuteChanged = { muted -> setMuted(muted) },
        onEndpointsChanged = { current, available ->
            coreContext.updateActiveCall {
                copy(currentAudioEndpoint = current, availableAudioEndpoints = available)
            }
        },
    )

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
        config.apiUrl = "https://api-us-3.vonage.com"
        config.websocketUrl = "wss://ws-us-3.vonage.com"
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
        }

        client.setOnLegStatusUpdate { callId, legId, status ->
            println("🔄 Call status updated: $callId, status: $status")
            if (currentIfMatches(callId) != null && status == LegStatus.answered) {
                markActive()
            }
        }

        client.setOnCallHangupListener { callId, callQuality, reason ->
            println("📴 Call ended: $callId, reason: ${reason.name}")
            if (currentIfMatches(callId) != null) {
                val cause = when(reason) {
                    HangupReason.remoteReject -> DisconnectCause.REJECTED
                    HangupReason.remoteHangup -> DisconnectCause.REMOTE
                    HangupReason.localHangup -> DisconnectCause.LOCAL
                    HangupReason.mediaTimeout -> DisconnectCause.BUSY
                    HangupReason.remoteNoAnswerTimeout -> DisconnectCause.CANCELED
                }
                cleanUp(cause)
            }
        }

        client.setOnCallMediaDisconnectListener { callId, reason ->
            println("❌ Media disconnected - Call: $callId, Reason: ${reason.name}")
            if (currentIfMatches(callId) != null) cleanUp(DisconnectCause.ERROR)
        }

        client.setOnCallMediaReconnectingListener { callId ->
            println("🔄 Media reconnecting - Call: $callId")
            if (currentIfMatches(callId) != null) {
                coreContext.updateActiveCall { copy(state = CallState.RECONNECTING) }
            }
        }

        client.setOnCallMediaReconnectionListener { callId ->
            println("✅ Media reconnected - Call: $callId")
            if (currentIfMatches(callId) != null) markActive()
        }

        client.setCallInviteCancelListener { callId, reason ->
            println("📴 Call invite cancelled: $callId, reason: ${reason.name}")
            if (currentIfMatches(callId) != null) {
                val cause = when(reason){
                    VoiceInviteCancelReason.AnsweredElsewhere -> DisconnectCause.ANSWERED_ELSEWHERE
                    VoiceInviteCancelReason.RejectedElsewhere -> DisconnectCause.REJECTED
                    VoiceInviteCancelReason.RemoteCancel -> DisconnectCause.CANCELED
                    VoiceInviteCancelReason.RemoteTimeout -> DisconnectCause.MISSED
                }
                cleanUp(cause)
            }
        }

        client.setCallTransferListener { callId, conversationId ->
            println("🔀 Call transferred - Call: $callId, Conversation: $conversationId")
            if (currentIfMatches(callId) != null) markActive()
        }

        client.setOnMutedListener { callId, legId, isMuted ->
            println("🔇 Mute status changed - Call: $callId, Leg: $legId, Muted: $isMuted")
            // Only mirror our own leg (callId == legId), not peer legs.
            if (currentIfMatches(callId) != null && callId == legId) {
                coreContext.updateActiveCall { copy(isMuted = isMuted) }
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
        if (coreContext.activeCall.value != null) {
            cleanUp(DisconnectCause.MISSED)
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
                showToast(context, "Outgoing Call Error: ${it.message}")
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
                    // Start a new Outgoing Call if there is not an active one
                    if (coreContext.activeCall.value == null) {
                        placeOutgoingCall(this.callId, this.callerDisplayName, isReconnected = true)
                    }
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

    // MARK: - Call Actions (operate on the single active call)

    fun answerCall(){
        val call = coreContext.activeCall.value ?: return
        // Answer on Telecom (grants audio + background-mic) and on the SDK; they
        // are independent. markActive() promotes state once the SDK confirms.
        telecom.answer()
        client.answer(call.callId) { err ->
            if (err != null) {
                println("Error Answering Call: $err")
                cleanUp(DisconnectCause.ERROR)
            } else {
                println("Answered call with id: ${call.callId}")
                markActive()
            }
        }
    }

    fun rejectCall(){
        val call = coreContext.activeCall.value ?: return
        client.reject(call.callId){ err ->
            if (err != null) {
                println("Error Rejecting Call: $err")
                cleanUp(DisconnectCause.ERROR)
            } else {
                println("Rejected call with id: ${call.callId}")
                cleanUp(DisconnectCause.REJECTED)
            }
        }
    }

    fun hangupCall(){
        val call = coreContext.activeCall.value ?: return
        client.hangup(call.callId) { err ->
            if (err != null) {
                println("Error Hanging Up Call: $err")
                // On error the onCallHangupListener will not fire, so clean up here.
                cleanUp(DisconnectCause.LOCAL)
            } else {
                println("Hung up call with id: ${call.callId}")
                // The onCallHangupListener will fire with the reason.
            }
        }
    }

    fun mute() = setMuted(true)
    fun unmute() = setMuted(false)

    private fun setMuted(target: Boolean){
        val call = coreContext.activeCall.value ?: return
        if (call.isMuted == target) return
        val callback: (Exception?) -> Unit = { err ->
            if (err != null) println("Error setting mute=$target: $err")
            else coreContext.updateActiveCall { copy(isMuted = target) }
        }
        if (target) client.mute(call.callId, callback) else client.unmute(call.callId, callback)
    }

    fun enableNoiseSuppression() = setNoiseSuppression(true)
    fun disableNoiseSuppression() = setNoiseSuppression(false)

    private fun setNoiseSuppression(target: Boolean){
        val call = coreContext.activeCall.value ?: return
        if (call.isNoiseSuppressionEnabled == target) return
        val callback: (Exception?) -> Unit = { err ->
            if (err != null) println("Error setting noise suppression=$target: $err")
            else coreContext.updateActiveCall { copy(isNoiseSuppressionEnabled = target) }
        }
        if (target) client.enableNoiseSuppression(call.callId, callback)
        else client.disableNoiseSuppression(call.callId, callback)
    }

    fun holdCall(){
        val call = coreContext.activeCall.value ?: return
        if (call.isOnHold) return
        // Hold = earmuff (stop hearing peer) + mute (stop sending audio).
        client.enableEarmuff(call.callId) { e1 ->
            if (e1 != null) { println("Error enabling earmuff: $e1"); return@enableEarmuff }
            client.mute(call.callId) { e2 ->
                if (e2 != null) println("Error muting on hold: $e2")
                else coreContext.updateActiveCall { copy(isOnHold = true) }
            }
        }
    }

    fun unholdCall(){
        val call = coreContext.activeCall.value ?: return
        if (!call.isOnHold) return
        client.unmute(call.callId) { e1 ->
            if (e1 != null) { println("Error unmuting on unhold: $e1"); return@unmute }
            client.disableEarmuff(call.callId) { e2 ->
                if (e2 != null) println("Error disabling earmuff: $e2")
                else coreContext.updateActiveCall { copy(isOnHold = false) }
            }
        }
    }

    fun sendDtmf(digit: String){
        val call = coreContext.activeCall.value ?: return
        client.sendDTMF(call.callId, digit){ err ->
            if (err != null) println("Error in Sending DTMF '$digit': $err")
            else println("Sent DTMF '$digit' on call with id: ${call.callId}")
        }
    }

    /** Switch the call audio output (speaker / Bluetooth / wired / earpiece). */
    fun setAudioEndpoint(endpoint: androidx.core.telecom.CallEndpointCompat){
        telecom.setAudioEndpoint(endpoint)
    }

    // MARK: - Call lifecycle helpers

    private fun placeIncomingCall(callId: CallId, caller: String, type: VoiceChannelType){
        println("Call from: $caller, channel $callId, channelType: $type")
        coreContext.setActiveCall(
            ActiveCall(callId = callId, displayName = caller, isIncoming = true, state = CallState.RINGING)
        )
        // The service hosts the Telecom registration and posts the CallStyle
        // notification (whose full-screen intent wakes CallActivity over the
        // keyguard); a foregrounded MainActivity also observes activeCall.
        CallService.register(context)
    }

    private fun placeOutgoingCall(callId: CallId, callee: String, isReconnected: Boolean = false){
        println("Placing outgoing call $callId to $callee (reconnected=$isReconnected)")
        coreContext.setActiveCall(
            ActiveCall(
                callId = callId,
                displayName = callee,
                isIncoming = false,
                state = if (isReconnected) CallState.ACTIVE else CallState.DIALING,
                connectedAtMillis = if (isReconnected) System.currentTimeMillis() else null,
            )
        )
        CallService.register(context)
        // A reconnected call is already up; promote it to active (queued until the
        // Telecom registration binds).
        if (isReconnected) telecom.setActive()
    }

    /**
     * Register the active call with Telecom. Called by [CallService] from its own
     * scope so the started service anchors the registration — see
     * [CallManager.registerCall].
     */
    suspend fun registerActiveCallWithTelecom() {
        val call = coreContext.activeCall.value ?: return
        telecom.registerCall(call.displayName, call.isIncoming)
    }

    /** Promote the call to active (answered / peer-answered / media reconnected). */
    private fun markActive(){
        coreContext.updateActiveCall {
            copy(
                state = CallState.ACTIVE,
                isOnHold = false,
                connectedAtMillis = connectedAtMillis ?: System.currentTimeMillis(),
            )
        }
        telecom.setActive()
    }

    /** End the call: tear down Telecom, show the disconnect state, then clear it. */
    private fun cleanUp(cause: Int){
        telecom.disconnect(cause)
        coreContext.updateActiveCall { copy(state = CallState.DISCONNECTED, disconnectCause = cause) }
        // Keep the disconnect state briefly so the UI can show it, then clear.
        scope.launch {
            delay(1000)
            coreContext.setActiveCall(null)
        }
    }

    /** The active call, only if its id matches [callId]. */
    private fun currentIfMatches(callId: CallId): ActiveCall? =
        coreContext.activeCall.value?.takeIf { it.callId == callId }
}
