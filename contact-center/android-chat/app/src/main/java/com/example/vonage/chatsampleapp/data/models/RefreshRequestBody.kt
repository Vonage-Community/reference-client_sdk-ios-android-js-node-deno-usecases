package com.example.vonage.chatsampleapp.data.models

data class RefreshRequestBody(
    val refreshToken: String,
    val availability: AgentAvailability = AgentAvailability.CHAT,
    val type: String = DeviceRequestType.REFRESH.serialName
)