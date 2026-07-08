package com.example.vonage.voicesampleapp.telecom

import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.app.TaskStackBuilder
import com.example.vonage.voicesampleapp.activities.CallActivity

/**
 * Builds the user-visible `CallStyle` notification for the ringing / ongoing call.
 *
 * This object only *constructs* the notification — [CallService] owns its
 * lifetime (posts/cancels via [NotificationManagerCompat]) so it can never
 * outlive the call.
 *
 *  - [buildIncoming] — `forIncomingCall` with a full-screen intent so a
 *    push-delivered invite wakes [CallActivity] over the keyguard.
 *  - [buildOngoing] — `forOngoingCall` with a single Hang up action and a
 *    duration chronometer pinned to the real connect time.
 *
 * Decline / Hang up are broadcasts to [CallActionReceiver]. Answer is an
 * **Activity** PendingIntent (not a broadcast that then calls `startActivity` —
 * that is a notification trampoline, banned since Android 12).
 */
object CallNotifier {

    const val ACTION_ANSWER = "com.example.vonage.voicesampleapp.ANSWER"
    const val ACTION_DECLINE = "com.example.vonage.voicesampleapp.DECLINE"
    const val ACTION_HANGUP = "com.example.vonage.voicesampleapp.HANGUP"

    const val NOTIFICATION_ID = 0x600DCA11

    private const val CHANNEL_INCOMING = "voicesampleapp_call_incoming"
    private const val CHANNEL_ONGOING = "voicesampleapp_call_ongoing"

    fun buildIncoming(context: Context, caller: String): Notification =
        build(context, caller, ringing = true, connectedAtMillis = null)

    fun buildOngoing(context: Context, caller: String, connectedAtMillis: Long?): Notification =
        build(context, caller, ringing = false, connectedAtMillis = connectedAtMillis)

    @SuppressLint("NotificationFullScreenIntent")
    private fun build(
        context: Context,
        caller: String,
        ringing: Boolean,
        connectedAtMillis: Long?,
    ): Notification {
        ensureChannels(context)
        val person = Person.Builder().setName(caller).setImportant(true).build()
        val tap = activityIntent(context, action = null)

        val style = if (ringing) {
            NotificationCompat.CallStyle.forIncomingCall(
                person,
                broadcastIntent(context, ACTION_DECLINE, 1),
                activityIntent(context, ACTION_ANSWER),
            )
        } else {
            NotificationCompat.CallStyle.forOngoingCall(
                person,
                broadcastIntent(context, ACTION_HANGUP, 0),
            )
        }

        return NotificationCompat.Builder(
            context,
            if (ringing) CHANNEL_INCOMING else CHANNEL_ONGOING,
        )
            .setStyle(style)
            // USE_FULL_SCREEN_INTENT is manifest-declared and auto-granted for a
            // CATEGORY_CALL app. Incoming: wakes CallActivity over the keyguard.
            // Ongoing: satisfies the platform's "CallStyle must be FGS-backed or
            // full-screen" gate (we own no FGS) and yields the tap-to-return chip.
            .setFullScreenIntent(tap, true)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(tap)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .apply {
                // Pin the call-duration chronometer to the real connect time so it
                // counts up correctly and survives re-posts. Without a fixed
                // `when`, every re-post would reset the elapsed time to 0.
                if (!ringing && connectedAtMillis != null) {
                    setWhen(connectedAtMillis)
                    setShowWhen(true)
                    setUsesChronometer(true)
                } else {
                    setShowWhen(false)
                }
            }
            .build()
    }

    private fun ensureChannels(context: Context) {
        // NotificationChannelCompat is API-safe (no-ops below API 26). The
        // incoming channel carries the system ringtone with RINGTONE audio
        // attributes so an inbound call actually rings; the ongoing channel is
        // low-importance so the in-call chip stays quiet.
        val incoming = NotificationChannelCompat.Builder(
            CHANNEL_INCOMING,
            NotificationManagerCompat.IMPORTANCE_HIGH,
        )
            .setName("Incoming calls")
            .setDescription("Ringing for incoming calls")
            .setVibrationEnabled(true)
            .setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build(),
            )
            .build()
        val ongoing = NotificationChannelCompat.Builder(
            CHANNEL_ONGOING,
            NotificationManagerCompat.IMPORTANCE_LOW,
        )
            .setName("Active call")
            .setDescription("Shows the ongoing call")
            .build()
        NotificationManagerCompat.from(context)
            .createNotificationChannelsCompat(listOf(incoming, ongoing))
    }

    private fun activityIntent(context: Context, action: String?): PendingIntent {
        val intent = Intent(context, CallActivity::class.java)
            .apply { action?.let(::setAction) }
        // Distinct request code per action so the variants don't collide under
        // FLAG_UPDATE_CURRENT.
        val requestCode = if (action == ACTION_ANSWER) 2 else 0
        // Synthesize MainActivity (CallActivity's manifest parent) beneath the
        // call screen so the call runs inside the app's normal task. Without
        // this, a notification-launched CallActivity starts a detached NEW_TASK
        // when the app was swiped away — finishing the call then leaves an empty
        // task that the launcher / recents can't return to.
        return TaskStackBuilder.create(context)
            .addNextIntentWithParentStack(intent)
            .getPendingIntent(
                requestCode,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )!!
    }

    private fun broadcastIntent(context: Context, action: String, requestCode: Int): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            requestCode,
            Intent(context, CallActionReceiver::class.java).setAction(action),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
}
