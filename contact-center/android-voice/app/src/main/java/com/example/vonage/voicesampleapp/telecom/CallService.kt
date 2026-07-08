package com.example.vonage.voicesampleapp.telecom

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.core.ActiveCall
import com.example.vonage.voicesampleapp.core.CallState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

/**
 * Started (NOT foreground) service that owns the call's [CallStyle][CallNotifier]
 * notification, **hosts the Telecom call registration**, and anchors the process
 * for the call's lifetime.
 *
 * **Why no `startForeground`/FGS:** Core-Telecom already makes the app a
 * foreground service while a call is registered and a CallStyle notification is
 * posted (see [CallManager]). A second manual FGS is redundant and can conflict.
 *
 * **Why registration lives here (not in an app singleton):** [CallManager.registerCall]
 * (`addCall`) is launched from this started service's scope. The started service
 * is what gives the process the standing for Telecom to keep the call — a call
 * registered from a cold-started background process with no service anchor is
 * added then immediately destroyed. This mirrors the official platform-samples
 * `TelecomCallService`.
 *
 * **What else this service gives us:** a long-lived process anchor so the call
 * **survives task removal** (swipe) — we deliberately do NOT hang up on swipe —
 * and a single owner for the notification so it is cancelled deterministically
 * when the call ends (never a zombie).
 *
 * The notification is derived purely from [com.example.vonage.voicesampleapp.core.CoreContext.activeCall]
 * (the single source of truth): the service observes it, posts incoming/ongoing,
 * and when no call remains it cancels and stops itself.
 */
class CallService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    /** Signature of the last-posted notification; re-post only when it changes. */
    private var lastKey: String? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        App.coreContext.activeCall
            .onEach(::reconcile)
            .launchIn(scope)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // A null intent means the system restarted us after an abrupt kill: the
        // observer reconciles against current state (typically no call -> cancel
        // + stop), clearing any stale notification.
        if (intent == null) return START_NOT_STICKY
        if (intent.action == ACTION_REGISTER) {
            // Host the Telecom call registration inside this started service so the
            // process has service standing when addCall runs — see CallManager.registerCall.
            scope.launch { App.coreContext.clientManager.registerActiveCallWithTelecom() }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        NotificationManagerCompat.from(this).cancel(CallNotifier.NOTIFICATION_ID)
        super.onDestroy()
    }

    /**
     * Maps call state -> notification and stops the service when the call is fully
     * cleared.
     *
     * Re-posts only when the notification's inputs change (phase / caller /
     * connect time), tracked via [lastKey]. Mute/hold/noise-suppression toggles
     * and RTC-stats churn don't affect the notification, so they don't re-post —
     * this is what keeps the CallStyle duration chronometer from resetting.
     */
    private fun reconcile(call: ActiveCall?) {
        val nm = NotificationManagerCompat.from(this)
        val spec = specOf(call)
        if (spec == null) {
            lastKey = null
            nm.cancel(CallNotifier.NOTIFICATION_ID)
            // Keep running through the brief DISCONNECTED state (so the Telecom
            // disconnect completes and the call scope unwinds cleanly); stop only
            // once the call is fully cleared.
            if (call == null) stopSelf()
            return
        }
        if (spec.key == lastKey) return
        lastKey = spec.key
        val notification = if (spec.ringing) {
            CallNotifier.buildIncoming(this, spec.caller)
        } else {
            CallNotifier.buildOngoing(this, spec.caller, spec.connectedAtMillis)
        }
        try {
            nm.notify(CallNotifier.NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS denied — the call still runs via Telecom; the
            // user just won't see the chip.
            Log.w(TAG, "notification post denied", e)
        }
    }

    /** The notification-relevant projection of the call; null = no notification. */
    private fun specOf(call: ActiveCall?): NotificationSpec? = when (call?.state) {
        null, CallState.DISCONNECTED -> null
        CallState.RINGING -> NotificationSpec(ringing = true, caller = call.displayName, connectedAtMillis = null)
        else -> NotificationSpec(ringing = false, caller = call.displayName, connectedAtMillis = call.connectedAtMillis)
    }

    private data class NotificationSpec(
        val ringing: Boolean,
        val caller: String,
        val connectedAtMillis: Long?,
    ) {
        val key: String get() = "${if (ringing) "ring" else "call"}|$caller|$connectedAtMillis"
    }

    companion object {
        private const val TAG = "CallService"
        private const val ACTION_REGISTER = "com.example.vonage.voicesampleapp.REGISTER_CALL"

        /**
         * Start the service and have it register the current [CoreContext.activeCall]
         * with Telecom. Idempotent (CallManager guards against double registration).
         */
        fun register(context: Context) {
            // startService throws IllegalStateException on API 26+ if we're
            // backgrounded, but a high-priority FCM push grants a temporary start
            // allowance so the wake path still succeeds. If it's ever blocked, the
            // call still runs via the SDK media path; only the Telecom integration
            // (system UI + audio routing) is missed.
            try {
                context.startService(
                    Intent(context, CallService::class.java).setAction(ACTION_REGISTER),
                )
            } catch (e: IllegalStateException) {
                Log.w(TAG, "CallService start blocked (backgrounded)", e)
            }
        }
    }
}
