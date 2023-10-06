package com.example.vonage.chatsampleapp.data

import android.content.Context
import com.example.vonage.chatsampleapp.utils.PrivatePreferences

/**
 * A singleton class for storing and accessing Core Application Data
 */
class ClientContext constructor(private val context: Context) {
    /**
     * The last valid Vonage API Token used to create a session.
     */
    var authToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.AUTH_TOKEN, context)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.AUTH_TOKEN, value, context)
    }

    /**
     * A refresh token to retrieve a fresh Auth Token via Custom API.
     */
    var refreshToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.REFRESH_TOKEN, context)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.REFRESH_TOKEN, value, context)
    }

    /**
     * The Firebase Push Token obtained via PushNotificationService.
     */
    var pushToken: String? get() {
        return PrivatePreferences.get(PrivatePreferences.PUSH_TOKEN, context)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.PUSH_TOKEN, value, context)
    }
    /**
     * The Device ID bound to the Push Token once it will be registered.
     * It will be used to unregister the Push Token later on.
     */
    var deviceId: String? get() {
        return PrivatePreferences.get(PrivatePreferences.DEVICE_ID, context)
    } set(value) {
        PrivatePreferences.set(PrivatePreferences.DEVICE_ID, value, context)
    }
}