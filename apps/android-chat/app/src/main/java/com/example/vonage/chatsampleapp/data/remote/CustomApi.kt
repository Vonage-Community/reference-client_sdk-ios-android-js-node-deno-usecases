package com.example.vonage.chatsampleapp.data.remote

import com.example.vonage.chatsampleapp.BuildConfig
import com.example.vonage.chatsampleapp.data.models.LoginRequestBody
import com.example.vonage.chatsampleapp.data.models.TokenResponse
import com.example.vonage.chatsampleapp.data.models.RefreshRequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface CustomApi {
    @POST(BuildConfig.API_LOGIN_URL)
    suspend fun login(@Body request: LoginRequestBody): Response<TokenResponse>

    @POST(BuildConfig.API_REFRESH_URL)
    suspend fun refresh(@Body request: RefreshRequestBody): Response<TokenResponse>
}