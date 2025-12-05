package com.example.vonage.voicesampleapp.services

import com.example.vonage.voicesampleapp.App
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class PushNotificationService : FirebaseMessagingService() {
    companion object {
        /**
         * Request FCM Token Explicitly.
         */
        fun requestToken(onSuccessCallback: ((String) -> Unit)? = null){
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    task.result?.let { token ->
                        println("FCM Device Push Token: $token")
                        App.coreContext.pushToken = token
                        onSuccessCallback?.invoke(token)
                    }
                }
            }
        }
    }
    override fun onNewToken(token: String) {
        println("New FCM Device Push Token: $token")
        App.coreContext.pushToken = token
    }
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Process VoIP push through VoiceClientManager
        // It will handle session restoration if needed
        App.coreContext.clientManager.processVoipPush(remoteMessage)
    }
}