package com.example.vonage.chatsampleapp.push

import android.Manifest
import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.utils.convertUTCToTimestamp
import com.example.vonage.chatsampleapp.view.MainActivity
import com.vonage.clientcore.core.api.models.EventTimestamp

class NotificationHelper(private val context: Context) {
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val notificationsMap : MutableMap<Int, MutableList<NotificationCompat.MessagingStyle.Message>> = mutableMapOf()
    companion object {
        private const val CHANNEL_ID = "message_channel"
        private const val KEY_REPLY = "key_reply"
        const val CONVERSATION_ID = "CONVERSATION_ID"
    }

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "Message Channel"
            val channelDescription = "Channel for incoming message notifications"
            val importance = NotificationManager.IMPORTANCE_HIGH

            val channel = NotificationChannel(CHANNEL_ID, channelName, importance)
            channel.description = channelDescription

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showNotification(
        conversationId: String,
        conversationTitle: String,
        sender: String,
        message: String,
        timestamp: EventTimestamp,
    ) {
        if(!checkPermission() || isAppInForeground) return

        // Use the conversationId's hash code as a unique request code
        val conversationHash = conversationId.hashCode()

        // Build Intent
        val intent = Intent(context, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        intent.putExtra(CONVERSATION_ID, conversationId)

        // Build Pending Intent to handle Tap
        val pendingIntent = PendingIntent.getActivity(
            context,
            conversationHash,
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build new message
        val newMessage = NotificationCompat.MessagingStyle.Message(
            message,
            convertUTCToTimestamp(timestamp),
            Person.Builder().setName(sender).build()
        )

        val isNotificationActive = notificationManager.activeNotifications.any {
            it.id == conversationHash
        }

        // Update Hash Map
        if(isNotificationActive){
            notificationsMap[conversationHash]?.add(newMessage)
        }else {
            notificationsMap[conversationHash] = mutableListOf(newMessage)
        }

        // Build Notification
        val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.vonage_logo_svg) // Replace with your app's notification icon
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setStyle(NotificationCompat.MessagingStyle(Person.Builder().setName("Me").build())
                .setConversationTitle(conversationTitle)
                .also {
                    notificationsMap[conversationHash]?.forEach { message ->
                        it.addMessage(message)
                    }
                }
            )

        notificationManager.notify(conversationHash, notificationBuilder.build())
    }

    private fun checkPermission() : Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private val isAppInForeground : Boolean get() {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val appProcesses = activityManager.runningAppProcesses
        val packageName = context.packageName

        appProcesses?.forEach { appProcess ->
            if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName == packageName) {
                return true
            }
        }
        return false
    }
}
