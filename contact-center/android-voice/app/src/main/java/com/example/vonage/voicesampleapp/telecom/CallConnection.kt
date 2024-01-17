package com.example.vonage.voicesampleapp.telecom

import android.telecom.CallAudioState
import android.telecom.Connection
import android.telecom.DisconnectCause
import com.example.vonage.voicesampleapp.App
import com.vonage.voice.api.CallId

/**
 * A Connection class used to initiate a connection
 * when a User receives an incoming or outgoing call
 */
class CallConnection(val callId: CallId) : Connection() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager
    var isMuted = false
    var isCallOnHold = false
    init {
        val properties = connectionProperties or PROPERTY_SELF_MANAGED
        connectionProperties = properties

        val capabilities = connectionCapabilities or CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD or CAPABILITY_HOLD
        connectionCapabilities = capabilities

        audioModeIsVoip = true
    }

    override fun onStateChanged(state: Int) {
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

    override fun onCallAudioStateChanged(state: CallAudioState?) {
        state ?: return
        // Trigger mute/unmute only if states are not consistent
        val shouldMute = state.isMuted
        if (shouldMute != this.isMuted) {
            val muteAction = if (shouldMute) clientManager::muteCall else clientManager::unmuteCall
            muteAction(this)
        }
        val route = state.route
        println("isMuted: $isMuted, route: $route")
    }

    override fun onPlayDtmfTone(c: Char) {
        println("Dtmf Char received: $c")
        clientManager.sendDtmf(this, c.toString())
    }

    override fun onHold() {
        if (!isCallOnHold) {
            clientManager.holdCall(this)
            isCallOnHold = true
        } else {
            clientManager.unholdCall(this)
            isCallOnHold = false
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
        coreContext.activeCall = coreContext.activeCall ?: this
    }

    private fun clearActiveCall(){
        // Reset active call only if it was the current one
        coreContext.activeCall?.takeIf { it == this }?.let { coreContext.activeCall = null }
    }
}