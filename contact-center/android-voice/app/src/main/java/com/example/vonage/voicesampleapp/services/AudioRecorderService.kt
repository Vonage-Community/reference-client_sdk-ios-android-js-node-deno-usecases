package com.example.vonage.voicesampleapp.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.vonage.voicesampleapp.activities.MainActivity

/**
 * This service enables audio recording even when the app is in the background.
 *
 * When activated, it displays a notification to inform the user that audio recording is in progress.
 */
class AudioRecorderService : Service() {

    companion object {
        private const val CHANNEL_ID = "ForegroundServiceChannel"
        private const val CHANNEL_NAME: String = "Audio Foreground Service"
        private const val NOTIFICATION_ID_MIC: Int = 1
        private const val REQUEST_MIC: Int = 1001
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Create a notification to make it a foreground service
        createNotificationChannel()
        val notification = createNotification()
        startForeground(NOTIFICATION_ID_MIC, notification)

        return START_STICKY
    }

    private fun createNotificationChannel() {
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_DEFAULT
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(serviceChannel)
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            REQUEST_MIC,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Audio Recorder Service")
            .setContentText("Recording audio for an ongoing call...")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setLargeIcon(BitmapFactory.decodeResource(resources, android.R.drawable.ic_btn_speak_now))
            .setContentIntent(pendingIntent)
            .build()
    }
}
