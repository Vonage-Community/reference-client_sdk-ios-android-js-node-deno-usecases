package com.example.vonage.voicesampleapp.telecom

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
    
    // StateFlows for observing state changes
    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()
    
    private val _isOnHold = MutableStateFlow(false)
    val isOnHold: StateFlow<Boolean> = _isOnHold.asStateFlow()
    
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
        when(state){
            STATE_RINGING, STATE_DIALING -> { setActiveCall() }
            STATE_DISCONNECTED -> { clearActiveCall() }
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
        // Called by phone UI when user toggles mute from phone controls
        println("onMuteStateChanged: $isMuted")
        if (isMuted != this.isMuted.value) {
            val muteAction = if (isMuted) clientManager::muteCall else clientManager::unmuteCall
            muteAction(this)
            _isMuted.value = isMuted
        }
    }

    override fun onPlayDtmfTone(c: Char) {
        println("Dtmf Char received: $c")
        clientManager.sendDtmf(this, c.toString())
    }

    override fun onHold() {
        // Called by phone UI when user puts call on hold from phone controls
        println("onHold")
        if(!isOnHold.value){
            clientManager.holdCall(this)
            _isOnHold.value = true
            setOnHold()
        }
    }

    override fun onUnhold() {
        // Called by phone UI when user takes call off hold from phone controls
        println("onUnhold")
        if(isOnHold.value){
            clientManager.unholdCall(this)
            _isOnHold.value = false
            setActive()
        }
    }

    fun selfDestroy(){
        println("[$callId] Connection  is no more useful, destroying it")
        setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
        destroy()
    }

    fun disconnect(disconnectCause: DisconnectCause){
        println("[$callId] Connection is being disconnected with cause [$disconnectCause]")
        setDisconnected(disconnectCause)
        destroy()
    }

    private fun setActiveCall(){
        // Update active call only if current is null
        coreContext.activeCall.value
            ?: coreContext.setActiveCall(this)
    }

    fun toggleHoldState(){
        // Called by CallActivity when user taps hold button
        println("toggleHoldState: ${!isOnHold.value}")
        if(isOnHold.value){
            onUnhold()
        } else {
            onHold()
        }
    }

    fun toggleMuteState(){
        // Called by CallActivity when user taps mute button
        println("toggleMuteState: ${!isMuted.value}")
        onMuteStateChanged(!isMuted.value)
    }

    private fun clearActiveCall(){
        // Reset active call only if it was the current one
        coreContext.activeCall.value?.takeIf { it == this }?.let {
            coreContext.setActiveCall(null)
        }
    }
}