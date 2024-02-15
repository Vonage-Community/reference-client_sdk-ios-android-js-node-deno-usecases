package com.vonage.flutter_voice

import android.content.Context
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

class VonagePreferences @Inject constructor(@ApplicationContext val context: Context) {

    companion object {
        const val PREFS_NAME = "com.vonage.flutter_voice"

        const val PUSH_TOKEN_KEY = "push-token"
        const val VONAGE_JWT_KEY = "vonage-jwt"
    }
    private val preferences get() = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

    var pushToken: String?
        get() = preferences.getString(PUSH_TOKEN_KEY, null)
        set(value) {
            preferences.edit().putString(PUSH_TOKEN_KEY, value).apply()
        }

    var vonageJwt: String?
        get() = preferences.getString(VONAGE_JWT_KEY, null)
        set(value) {
            preferences.edit().putString(VONAGE_JWT_KEY, value).apply()
        }
}