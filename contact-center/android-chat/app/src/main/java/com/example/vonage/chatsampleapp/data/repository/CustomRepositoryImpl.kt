package com.example.vonage.chatsampleapp.data.repository

import com.example.vonage.chatsampleapp.data.models.LoginRequestBody
import com.example.vonage.chatsampleapp.data.models.RefreshRequestBody
import com.example.vonage.chatsampleapp.data.models.TokenResponse
import com.example.vonage.chatsampleapp.data.remote.CustomApi
import javax.inject.Inject

class CustomRepositoryImpl @Inject constructor (
    private val api: CustomApi
) : CustomRepository {
    override suspend fun login(deviceCode: String) : TokenResponse {
        val response = api.login(LoginRequestBody(deviceCode))
        return response.body() ?:
        when(val statusCode = response.code()){
            403 -> throw Exception("Invalid Code")
            else -> throw Exception("$statusCode ${response.message()}")
        }
    }

    override suspend fun refresh(refreshToken: String): TokenResponse {
        val response = api.refresh(RefreshRequestBody(refreshToken))
        return response.body() ?:
        when(val statusCode = response.code()){
            403 -> throw Exception("Invalid Refresh Token")
            else -> throw Exception("$statusCode ${response.message()}")
        }
    }
}