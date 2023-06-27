package com.example.vonage.chatsampleapp.utils

import android.content.Intent
import android.os.Bundle
import com.example.vonage.chatsampleapp.view.*

internal fun LoginActivity.navigateToMainActivity(extras: Bundle? = null){
    val intent = Intent(this, MainActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
    finish()
}

internal fun MainActivity.navigateToLoginActivity(extras: Bundle? = null){
    val intent = Intent(this, LoginActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
    finish()
}

internal fun MainActivity.navigateToCreateConversationActivity(extras: Bundle? = null){
    val intent = Intent(this, AddConversationActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
}

internal fun MainActivity.navigateToChatActivity(extras: Bundle? = null){
    val intent = Intent(this, ChatActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
}

internal fun ChatActivity.navigateToDetailsActivity(extras: Bundle? = null){
    val intent = Intent(this, ConversationDetailsActivity::class.java)
    extras?.let {
        intent.putExtras(it)
    }
    startActivity(intent)
}