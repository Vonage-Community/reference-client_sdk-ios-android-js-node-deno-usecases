package com.example.vonage.voicesampleapp.utils

import com.vonage.voice.api.CallId

data class CallInfo(
    val callId: CallId,
    val callerDisplayName: String
)
