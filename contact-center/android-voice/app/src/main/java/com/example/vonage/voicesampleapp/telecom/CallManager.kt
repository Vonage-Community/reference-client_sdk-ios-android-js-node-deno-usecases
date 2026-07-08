package com.example.vonage.voicesampleapp.telecom

import android.content.Context
import android.net.Uri
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallControlResult
import androidx.core.telecom.CallControlScope
import androidx.core.telecom.CallEndpointCompat
import androidx.core.telecom.CallsManager
import kotlinx.coroutines.launch

/**
 * Bridges the app's call to the Android Telecom stack via Jetpack Core-Telecom
 * ([CallsManager]) — the modern replacement for a hand-rolled self-managed
 * `ConnectionService`.
 *
 * Registering the call with Telecom (via [CallsManager.addCall]) is what grants
 * the process foreground-execution priority and live microphone audio for the
 * call's whole lifetime — including when answered from a backgrounded or killed
 * state — as long as a `CallStyle` notification is posted (see [CallNotifier]).
 * The app therefore owns no foreground service of its own.
 *
 * One call at a time. This wrapper is fire-and-forget OS integration: it never
 * writes back into [com.example.vonage.voicesampleapp.core.ActiveCall] —
 * [com.example.vonage.voicesampleapp.core.VoiceClientManager] remains the single
 * source of truth, driven by the Vonage SDK callbacks.
 *
 * @param onTelecomAnswer   a remote surface (watch, Auto, Bluetooth) asked to answer.
 * @param onTelecomDisconnect a remote surface asked to end the call.
 * @param onMuteChanged     system mute state changed; mirror it onto the SDK leg.
 * @param onEndpointsChanged current + available audio outputs changed (for the route picker).
 */
class CallManager(
    context: Context,
    private val onTelecomAnswer: () -> Unit,
    private val onTelecomDisconnect: () -> Unit,
    private val onMuteChanged: (Boolean) -> Unit,
    private val onEndpointsChanged: (current: CallEndpointCompat?, available: List<CallEndpointCompat>) -> Unit,
) {
    private val callsManager = CallsManager(context).apply {
        registerAppWithTelecom(CallsManager.CAPABILITY_BASELINE)
    }

    @Volatile
    private var control: CallControlScope? = null
    @Volatile
    private var registered = false

    // answer()/setActive() can be requested before the call-control block is
    // ready (fast answer from a cold/locked notification, or the just-placed
    // outgoing path); remember the intent and flush it on bind.
    @Volatile
    private var wantAnswer = false
    @Volatile
    private var wantActive = false

    // Latest audio endpoints, cached so either collect can forward both together.
    @Volatile
    private var lastCurrentEndpoint: CallEndpointCompat? = null
    @Volatile
    private var lastAvailableEndpoints: List<CallEndpointCompat> = emptyList()

    /**
     * Register the call with Telecom and suspend for its whole lifetime.
     *
     * **Must be called from the started [CallService]'s coroutine scope**, not
     * from an app-singleton scope. The started service is what gives the process
     * the standing for Telecom to keep (track) the call: a call registered from a
     * cold-started background process with no started-service anchor is added and
     * then immediately destroyed by Telecom
     * ([androidx.core.telecom.CallException.ERROR_CALL_IS_NOT_BEING_TRACKED]),
     * leaving every subsequent control op failing. Hosting `addCall` inside the
     * service mirrors the official platform-samples `TelecomCallService`.
     */
    suspend fun registerCall(displayName: String, isIncoming: Boolean) {
        if (registered) return
        registered = true
        wantAnswer = false
        wantActive = false
        val name = displayName.ifBlank { "Unknown" }
        val attributes = CallAttributesCompat(
            displayName = name,
            address = Uri.fromParts("sip", name, null),
            direction = if (isIncoming) {
                CallAttributesCompat.DIRECTION_INCOMING
            } else {
                CallAttributesCompat.DIRECTION_OUTGOING
            },
        )
        try {
            callsManager.addCall(
                attributes,
                onAnswer = { onTelecomAnswer() },
                onDisconnect = { onTelecomDisconnect() },
                onSetActive = {},
                onSetInactive = {},
            ) {
                control = this
                if (wantAnswer) launch { log("answer", answer(CallAttributesCompat.CALL_TYPE_AUDIO_CALL)) }
                if (wantActive) launch { log("setActive", setActive()) }
                launch { isMuted.collect(onMuteChanged) }
                // Current + available audio outputs feed the in-call route picker.
                launch {
                    currentCallEndpoint.collect {
                        lastCurrentEndpoint = it
                        onEndpointsChanged(it, lastAvailableEndpoints)
                    }
                }
                launch {
                    availableEndpoints.collect {
                        lastAvailableEndpoints = it
                        onEndpointsChanged(lastCurrentEndpoint, it)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Telecom call session ended exceptionally", e)
        } finally {
            control = null
            registered = false
            wantAnswer = false
            wantActive = false
            lastCurrentEndpoint = null
            lastAvailableEndpoints = emptyList()
            onEndpointsChanged(null, emptyList())
        }
    }

    /** Answer the incoming call — grants call audio + the background-mic exemption. */
    fun answer() {
        wantAnswer = true
        onControl { log("answer", answer(CallAttributesCompat.CALL_TYPE_AUDIO_CALL)) }
    }

    /** Promote an outgoing / peer-answered call to active. */
    fun setActive() {
        wantActive = true
        onControl { log("setActive", setActive()) }
    }

    /** Switch the call audio output (speaker / Bluetooth / wired / earpiece). */
    fun setAudioEndpoint(endpoint: CallEndpointCompat) =
        onControl { log("switchEndpoint", requestEndpointChange(endpoint)) }

    /** End the call and de-register it from Telecom. */
    fun disconnect(cause: Int = DisconnectCause.LOCAL) {
        // Core-Telecom's transactional CallControl.disconnect accepts only
        // LOCAL / REMOTE / MISSED / REJECTED and throws on anything else,
        // tearing down the session. Clamp at this boundary so callers may pass
        // any android.telecom cause without risking a crash.
        val safe = if (cause in VALID_CAUSES) cause else DisconnectCause.LOCAL
        onControl { log("disconnect", disconnect(DisconnectCause(safe))) }
    }

    private fun onControl(action: suspend CallControlScope.() -> Unit) {
        control?.let { c -> c.launch { c.action() } }
    }

    /** Surface a failed transactional Telecom op instead of dropping it silently. */
    private fun log(op: String, result: CallControlResult) {
        if (result is CallControlResult.Error) Log.w(TAG, "Telecom $op failed: ${result.errorCode}")
    }

    private companion object {
        const val TAG = "CallManager"

        // The only DisconnectCause codes Core-Telecom's CallControl accepts.
        val VALID_CAUSES = setOf(
            DisconnectCause.LOCAL,
            DisconnectCause.REMOTE,
            DisconnectCause.MISSED,
            DisconnectCause.REJECTED,
        )
    }
}
