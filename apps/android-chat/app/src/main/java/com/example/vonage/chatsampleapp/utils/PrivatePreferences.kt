package com.example.vonage.chatsampleapp.utils

import android.content.Context

internal object PrivatePreferences {
    private const val NAME = "MY_PREF"
    const val PUSH_TOKEN = "PUSH_TOKEN"
    const val DEVICE_ID = "DEVICE_ID"
    const val AUTH_TOKEN = "AUTH_TOKEN"
    const val REFRESH_TOKEN = "REFRESH_TOKEN"
    const val USERNAME = "USERNAME"
    fun set(key: String, value: String?, context: Context){
        context.getSharedPreferences(NAME, Context.MODE_PRIVATE)?.edit()?.apply {
            putString(key, value)
            apply()
        }
    }
    fun get(key: String, context: Context) : String? {
        return context.getSharedPreferences(NAME, Context.MODE_PRIVATE)?.getString(key, null)
    }
}