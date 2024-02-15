package com.vonage.flutter_voice

import android.os.Build
import androidx.annotation.RequiresApi
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.hiennv.flutter_callkit_incoming.Data
import com.hiennv.flutter_callkit_incoming.FlutterCallkitIncomingPlugin
import com.vonage.android_core.PushType
import com.vonage.voice.api.VoiceClient
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class VonageFirebasePushService : FirebaseMessagingService() {
        @Inject lateinit var callClient: CallClient
        @Inject lateinit var vonagePreferences: VonagePreferences

        override fun onNewToken(token: String) {
            super.onNewToken(token)
            println("PUSH TOKEN:  $token")
            vonagePreferences.pushToken = token
        }

        override fun onMessageReceived(remoteMessage: RemoteMessage) {
            println("PUSH DATA:  ${remoteMessage.data}")
            val dataString = remoteMessage.data.toString()
            val type: PushType = VoiceClient.getPushNotificationType(dataString)
            println("PUSH TYPE:  $type, $dataString")
            when (type) {
                PushType.INCOMING_CALL -> callClient.client.processPushCallInvite(dataString)?.let {
                    FlutterCallkitIncomingPlugin
                        .getInstance()
                        .showIncomingNotification(
                            Data(
                                mapOf(
                                    "id" to it,
                                    "nameCaller" to "Vonage",
                                    "type" to 0,
                                )
                            )
                        )
                }
                else -> {}
            }
        }
}