package com.example.vonage.chatsampleapp.data.models

data class TokenResponse(
    val vonageToken: String,
    val refreshToken: String
)