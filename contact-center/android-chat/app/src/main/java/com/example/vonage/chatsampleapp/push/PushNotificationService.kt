package com.example.vonage.chatsampleapp.push

import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class PushNotificationService: FirebaseMessagingService() {
    @Inject lateinit var clientManager: ChatClientManager
    override fun onCreate() {
        super.onCreate()
        requestToken()
    }

    /**
     * Request FCM Token Explicitly.
     */
    private fun requestToken(){
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                task.result?.let { token ->
                    println("FCM Device Push Token: $token")
                    clientManager.updatePushToken(token)
                }
            }
        }
    }

    override fun onNewToken(token: String) {
        println("New FCM Device Push Token: $token")
        clientManager.updatePushToken(token)
    }
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        clientManager.processPushMessage(remoteMessage)
    }
}