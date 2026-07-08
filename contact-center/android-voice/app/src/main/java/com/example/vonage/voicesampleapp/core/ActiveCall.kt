package com.example.vonage.voicesampleapp.core

import android.telecom.DisconnectCause
import androidx.core.telecom.CallEndpointCompat
import com.vonage.voice.api.CallId

/**
 * The single source of truth for the one in-progress call.
 *
 * Immutable: [VoiceClientManager] replaces it via [CoreContext.updateActiveCall]
 * on every SDK/Telecom event, and the UI ([CallActivity]) + the notification
 * ([com.example.vonage.voicesampleapp.telecom.CallService]) both derive purely
 * from it. This replaces the old `CallConnection : android.telecom.Connection`,
 * which coupled app state to the retired ConnectionService.
 */
data class ActiveCall(
    val callId: CallId,
    val displayName: String,
    val isIncoming: Boolean,
    val state: CallState,
    val isMuted: Boolean = false,
    val isOnHold: Boolean = false,
    val isNoiseSuppressionEnabled: Boolean = false,
    /** [DisconnectCause] code, set only in [CallState.DISCONNECTED], for the UI label. */
    val disconnectCause: Int? = null,
    /** Wall-clock connect time; pins the notification's call-duration chronometer. */
    val connectedAtMillis: Long? = null,
    /** Current audio output (earpiece/speaker/Bluetooth/wired), from Core-Telecom. */
    val currentAudioEndpoint: CallEndpointCompat? = null,
    /** Audio outputs the user can switch to, from Core-Telecom. */
    val availableAudioEndpoints: List<CallEndpointCompat> = emptyList(),
)

enum class CallState { RINGING, DIALING, ACTIVE, RECONNECTING, DISCONNECTED }
