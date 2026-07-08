package com.example.vonage.voicesampleapp.telecom

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.example.vonage.voicesampleapp.App

/**
 * Routes the `CallStyle` notification's Decline / Hang up actions to the
 * [com.example.vonage.voicesampleapp.core.VoiceClientManager].
 *
 * Answer is handled by an Activity PendingIntent (see [CallNotifier]) so it can
 * bring the call UI forward without a banned notification trampoline.
 */
class CallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val clientManager = App.coreContext.clientManager
        when (intent.action) {
            CallNotifier.ACTION_DECLINE -> clientManager.rejectCall()
            CallNotifier.ACTION_HANGUP -> clientManager.hangupCall()
        }
    }
}
