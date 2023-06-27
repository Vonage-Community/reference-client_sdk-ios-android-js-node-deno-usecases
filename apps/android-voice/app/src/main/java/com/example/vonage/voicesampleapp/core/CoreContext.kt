package com.example.vonage.voicesampleapp.core

import android.content.Context
import com.example.vonage.voicesampleapp.telecom.CallConnection
import com.example.vonage.voicesampleapp.telecom.TelecomHelper
import com.example.vonage.voicesampleapp.utils.CallInfo
import com.example.vonage.voicesampleapp.utils.Constants
import com.example.vonage.voicesampleapp.utils.PrivatePreferences

/**
 * A singleton class for storing and accessing Core Application Data
 */
class CoreContext private constructor(context: Context) {
    private val applicationContext: Context = context.applicationContext
    val telecomHelper: TelecomHelper by lazy { TelecomHelper(applicationContext) }
    val clientManager: VoiceClientManager by lazy { VoiceClientManager(applicationContext) }
    val notificationManager: InternalNotificationManager by lazy { InternalNotificationManager(applicationContext) }
    var activeCall: CallConnection? = null
        set(value) {
            PrivatePreferences.set(PrivatePreferences.CALL_ID, value?.callId, applicationContext)
            PrivatePreferences.set(PrivatePreferences.CALLER_DISPLAY_NAME, value?.callerDisplayName, applicationContext)
            field = value
        }

    /**
     * The Last Active Call's details.
     * We persist them for Call reconnection.
     */
    val lastActiveCall: CallInfo?
        get() = PrivatePreferences.get(PrivatePreferences.CALL_ID, applicationContext)?.let { callId ->
            CallInfo(callId, PrivatePreferences.get(PrivatePreferences.CALLER_DISPLAY_NAME, applicationContext) ?: Constants.DEFAULT_DIALED_NUMBER)
        }

    /**
     * The last valid Vonage API Token used to create a session.
     */
    var authToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.AUTH_TOKEN, applicationContext)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.AUTH_TOKEN, value, applicationContext)
    }

    /**
     * A refresh token to retrieve a fresh Auth Token via Custom API.
     */
    var refreshToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.REFRESH_TOKEN, applicationContext)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.REFRESH_TOKEN, value, applicationContext)
    }

    /**
     * The Firebase Push Token obtained via PushNotificationService.
     */
    var pushToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.PUSH_TOKEN, applicationContext)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.PUSH_TOKEN, value, applicationContext)
    }
    /**
     * The Device ID bound to the Push Token once it will be registered.
     * It will be used to unregister the Push Token later on.
     */
    var deviceId: String? get() {
        return PrivatePreferences.get(PrivatePreferences.DEVICE_ID, applicationContext)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.DEVICE_ID, value, applicationContext)
    }

    companion object {
        // Volatile will guarantee a thread-safe & up-to-date version of the instance
        @Volatile
        private var instance: CoreContext? = null

        fun getInstance(context: Context): CoreContext {
            return instance ?: synchronized(this) {
                instance ?: CoreContext(context).also { instance = it }
            }
        }
    }
}
