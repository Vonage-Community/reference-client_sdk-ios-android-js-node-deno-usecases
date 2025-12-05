package com.example.vonage.voicesampleapp.telecom

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import android.telecom.Connection
import android.telecom.DisconnectCause
import com.example.vonage.voicesampleapp.App
import com.vonage.voice.api.CallId
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * A Connection class used to initiate a connection
 * when a User receives an incoming or outgoing call
 */
class CallConnection(val callId: CallId) : Connection() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    
    // StateFlows for observing state changes
    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()
    
    private val _isOnHold = MutableStateFlow(false)
    val isOnHold: StateFlow<Boolean> = _isOnHold.asStateFlow()
    
    private val _isNoiseSuppressionEnabled = MutableStateFlow(false)
    val isNoiseSuppressionEnabled: StateFlow<Boolean> = _isNoiseSuppressionEnabled.asStateFlow()

    private val _connectionState = MutableStateFlow(STATE_INITIALIZING)
    val connectionState: StateFlow<Int> = _connectionState.asStateFlow()

    init {
        val properties = connectionProperties or PROPERTY_SELF_MANAGED
        connectionProperties = properties

        val capabilities = connectionCapabilities or CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD or CAPABILITY_HOLD
        connectionCapabilities = capabilities

        audioModeIsVoip = true
    }

    override fun onStateChanged(state: Int) {
        _connectionState.value = state
        when (state) {
            STATE_RINGING, STATE_DIALING -> setActiveCall()
            STATE_DISCONNECTED -> scheduleClearActiveCall()
        }
    }

    override fun onAnswer() {
        clientManager.answerCall(this)
    }

    override fun onReject() {
        clientManager.rejectCall(this)
    }

    override fun onDisconnect() {
        clientManager.hangupCall(this)
    }

    override fun onMuteStateChanged(isMuted: Boolean) {
        // Called by phone UI when user toggles mute from native phone controls
        println("onMuteStateChanged (phone UI): $isMuted")
        if (isMuted != _isMuted.value) {
            val action = if (isMuted) clientManager::muteCall else clientManager::unmuteCall
            action(this)
            // Flow will be toggled by VoiceClientManager on success
        }
    }

    override fun onPlayDtmfTone(c: Char) {
        println("Dtmf Char received: $c")
        clientManager.sendDtmf(this, c.toString())
    }

    override fun onHold() {
        // Called by phone UI when user puts call on hold
        println("onHold (phone UI)")
        if (!_isOnHold.value) {
            clientManager.holdCall(this)
            // State + telecom transition performed after success by toggleHold()
        }
    }

    override fun onUnhold() {
        // Called by phone UI when user takes call off hold
        println("onUnhold (phone UI)")
        if (_isOnHold.value) {
            clientManager.unholdCall(this)
            // State + telecom transition performed after success by toggleHold()
        }
    }

    fun selfDestroy() {
        println("[$callId] Connection is no more useful, destroying it")
        setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
        destroy()
    }

    fun disconnect(disconnectCause: DisconnectCause) {
        println("[$callId] Connection is being disconnected with cause [$disconnectCause]")
        setDisconnected(disconnectCause)
        destroy()
    }

    private fun setActiveCall() {
        // Update active call only if current is null
        coreContext.activeCall.value ?: coreContext.setActiveCall(this)
    }

    // Toggle helpers invoked by VoiceClientManager after successful SDK operation
    fun toggleMute() {
        _isMuted.value = !_isMuted.value
    }

    fun toggleHold() {
        val nowHolding = !_isOnHold.value
        _isOnHold.value = nowHolding
        if (nowHolding) setOnHold() else setActive()
    }

    fun toggleNoiseSuppression() {
        _isNoiseSuppressionEnabled.value = !_isNoiseSuppressionEnabled.value
    }

    private fun scheduleClearActiveCall() {
        // Clear active call only if it's this call
        coreContext.activeCall.value?.takeIf { it == this }?.let {
            scope.launch {
                // Delay clearing active call so UI can show disconnect state
                delay(1000)
                coreContext.setActiveCall(null)
                scope.cancel()
            }
        }
    }
}