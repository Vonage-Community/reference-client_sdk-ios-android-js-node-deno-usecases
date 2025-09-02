package com.example.vonage.voicesampleapp.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.os.IBinder
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.example.vonage.voicesampleapp.activities.MainActivity

/**
 * This service enables audio recording even when the app is in the background.
 *
 * When activated, it displays a notification to inform the user that audio recording is in progress.
 */
class AudioRecorderService : Service() {

    companion object {
        private const val CHANNEL_ID = "TestAppForegroundServiceChannel"
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Create a notification to make it a foreground service
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel()
        }
        val notification = createNotification()
        startForeground(1, notification)

        return START_NOT_STICKY
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createNotificationChannel() {
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            "Foreground Service Channel",
            NotificationManager.IMPORTANCE_DEFAULT
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(serviceChannel)
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Audio Recorder Service")
            .setContentText("Recording audio for an ongoing call...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setLargeIcon(BitmapFactory.decodeResource(resources, android.R.drawable.ic_btn_speak_now))
            .setContentIntent(pendingIntent)
            .build()
    }
}