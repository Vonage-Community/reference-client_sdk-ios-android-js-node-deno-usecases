package com.example.vonage.voicesampleapp.utils

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.fragment.app.FragmentActivity
import com.example.vonage.voicesampleapp.activities.CallActivity
import com.example.vonage.voicesampleapp.activities.LoginActivity
import com.example.vonage.voicesampleapp.activities.MainActivity
import com.example.vonage.voicesampleapp.activities.fragments.DialerFragment
import com.example.vonage.voicesampleapp.services.AudioRecorderService

internal fun ComponentActivity.navigateToMainActivity(extras: Bundle? = null){
    val intent = Intent(this, MainActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
    finish()
}

internal fun ComponentActivity.showDialerFragment(){
    // Show the fragment dialog
    if (this is FragmentActivity) {
        val dialerType = if (this is MainActivity) {
            DialerType.PHONE_NUMBER
        } else {
            DialerType.DTMF
        }
        DialerFragment.newInstance(dialerType)
            .show(supportFragmentManager, "DialerFragment")
    }
}

internal fun ComponentActivity.navigateToCallActivity(extras: Bundle? = null){
    val intent = Intent(this, CallActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
}

internal fun ComponentActivity.navigateToLoginActivity(extras: Bundle? = null){
    val intent = Intent(this, LoginActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
    finish()
}

internal fun navigateToMainActivity(context: Context, extras: Bundle? = null){
    val intent = Intent(context, MainActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    context.startActivity(intent)
}

internal fun startForegroundService(context: Context, extras: Bundle? = null){
    val intent = Intent(context, AudioRecorderService::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    context.startForegroundService(intent)
}

internal fun stopForegroundService(context: Context, extras: Bundle? = null){
    val intent = Intent(context, AudioRecorderService::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    context.stopService(intent)
}