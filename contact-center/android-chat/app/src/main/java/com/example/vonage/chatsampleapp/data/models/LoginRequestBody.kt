package com.example.vonage.chatsampleapp.data.models

data class LoginRequestBody(
    val code: String,
    val availability: AgentAvailability = AgentAvailability.CHAT,
    val type: String = DeviceRequestType.LOGIN.serialName
)