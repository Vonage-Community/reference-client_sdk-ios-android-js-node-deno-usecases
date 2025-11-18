package com.example.vonage.voicesampleapp.utils

import com.example.vonage.voicesampleapp.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.*
import java.lang.Exception

private const val LOGIN_REQUEST_TYPE = "login"
private const val REFRESH_REQUEST_TYPE = "refresh"
private const val VOICE_AVAILABILITY = "VOICE"
private const val PLACEHOLDER_BASE_URL = "http://example.com/"
private const val AUTH_HEADER = "Bearer ${BuildConfig.API_KEY}"
private const val ERROR_INVALID_CODE = "Invalid Code"
private const val ERROR_INVALID_REFRESH_TOKEN = "Invalid Refresh Token"

data class TokenResponse(
    val vonageToken: String,
    val refreshToken: String
)

data class LoginRequestBody(
    val code: String,
    val type: String = LOGIN_REQUEST_TYPE,
    val availability: String = VOICE_AVAILABILITY
)

data class RefreshRequestBody(
    val refreshToken: String,
    val type: String = REFRESH_REQUEST_TYPE,
    val availability: String = VOICE_AVAILABILITY
)
private interface CustomApi {
    @POST(BuildConfig.API_LOGIN_URL)
    fun login(
        @Header("Authorization") authorization: String,
        @Body request: LoginRequestBody
    ): Call<TokenResponse>

    @POST(BuildConfig.API_REFRESH_URL)
    fun refresh(
        @Header("Authorization") authorization: String,
        @Body request: RefreshRequestBody
    ): Call<TokenResponse>
}

class CustomRepository {

    private val api: CustomApi by lazy {
        createApi()
    }

    fun login(deviceCode: String, onResult: (Exception?, TokenResponse?)->Unit ){
        api.login(AUTH_HEADER,LoginRequestBody(deviceCode)).enqueue(
            object : Callback<TokenResponse> {
                override fun onResponse(call: Call<TokenResponse>, response: Response<TokenResponse>) {
                    response.body()?.let {
                        onResult(null, it)
                    } ?: when(response.code()){
                        403 -> onResult(Exception(ERROR_INVALID_CODE), null)
                        else -> onResult(Exception("${response.code()}: ${response.message()}"), null)
                    }
                }

                override fun onFailure(call: Call<TokenResponse>, t: Throwable) {
                    onResult(Exception(t.message), null)
                }
            }
        )
    }

    fun refresh(refreshToken: String, onResult: (Exception?, TokenResponse?)->Unit ){
        api.refresh(AUTH_HEADER,RefreshRequestBody(refreshToken)).enqueue(
            object : Callback<TokenResponse> {
                override fun onResponse(call: Call<TokenResponse>, response: Response<TokenResponse>) {
                    response.body()?.let {
                        onResult(null, it)
                    } ?: when(response.code()){
                        403 -> onResult(Exception(ERROR_INVALID_REFRESH_TOKEN), null)
                        else -> onResult(Exception("${response.code()}: ${response.message()}"), null)
                    }
                }

                override fun onFailure(call: Call<TokenResponse>, t: Throwable) {
                    onResult(Exception(t.message), null)
                }
            }
        )
    }

    private fun createApi(): CustomApi {
        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()

        val retrofit = Retrofit.Builder()
            // Placeholder base URL:
            // full URLs are specified for each endpoint
            .baseUrl(PLACEHOLDER_BASE_URL)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

        return retrofit.create(CustomApi::class.java)
    }
}