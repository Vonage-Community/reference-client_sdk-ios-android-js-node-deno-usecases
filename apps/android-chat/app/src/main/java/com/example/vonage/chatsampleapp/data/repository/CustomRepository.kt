package com.example.vonage.chatsampleapp.data.repository

import com.example.vonage.chatsampleapp.data.models.TokenResponse

interface CustomRepository {
    suspend fun login(deviceCode: String) : TokenResponse
    suspend fun refresh(refreshToken: String) : TokenResponse
}