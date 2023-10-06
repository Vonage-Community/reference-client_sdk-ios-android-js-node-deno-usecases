package com.example.vonage.chatsampleapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val clientManager: ChatClientManager,
) : ViewModel() {
    private val _loginEvent = MutableSharedFlow<LogInEvent>()
    val loginEvent = _loginEvent.asSharedFlow()

    var showProgress by mutableStateOf(false)
        private set

    val isLoggedIn: Boolean
        get() = !clientManager.sessionId.isNullOrEmpty()

    fun login(token: String, code: String, useToken: Boolean){
        showProgress = true
        viewModelScope.launch {
            try {
                if(useToken) clientManager.login(token)
                else clientManager.loginWithCode(code)
                _loginEvent.emit(LogInEvent.Success)
            }catch (error: Exception){
                _loginEvent.emit(LogInEvent.ErrorLogin(error.message ?: "Unknown Error"))
            }
            showProgress = false
        }
    }

    sealed class LogInEvent {
        data class ErrorLogin(val error: String) : LogInEvent()
        object Success: LogInEvent()
    }

}