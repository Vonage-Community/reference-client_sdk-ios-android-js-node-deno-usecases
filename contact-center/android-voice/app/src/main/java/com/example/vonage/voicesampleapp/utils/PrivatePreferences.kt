package com.example.vonage.voicesampleapp.utils

import android.content.Context
import android.content.Context.MODE_PRIVATE

object PrivatePreferences {
    private const val NAME = "MY_PREF"
    const val PUSH_TOKEN = "PUSH_TOKEN"
    const val DEVICE_ID = "DEVICE_ID"
    const val AUTH_TOKEN = "AUTH_TOKEN"
    const val REFRESH_TOKEN = "REFRESH_TOKEN"
    const val CALL_ID = "CALL_ID"
    const val CALLER_DISPLAY_NAME = "CALLER_DISPLAY_NAME"
    fun set(key: String, value: String?, context: Context){
        context.getSharedPreferences(NAME, MODE_PRIVATE)?.edit()?.apply {
            putString(key, value)
            apply()
        }
    }
    fun get(key: String, context: Context) : String? {
        return context.getSharedPreferences(NAME, MODE_PRIVATE)?.getString(key, null)
    }
}