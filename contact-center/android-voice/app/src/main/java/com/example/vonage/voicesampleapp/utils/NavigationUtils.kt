package com.example.vonage.voicesampleapp.utils

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.fragment.app.FragmentActivity
import com.example.vonage.voicesampleapp.activities.CallActivity
import com.example.vonage.voicesampleapp.activities.LoginActivity
import com.example.vonage.voicesampleapp.activities.MainActivity
import com.example.vonage.voicesampleapp.activities.fragments.DialerFragment

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
        DialerFragment.newInstance()
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
