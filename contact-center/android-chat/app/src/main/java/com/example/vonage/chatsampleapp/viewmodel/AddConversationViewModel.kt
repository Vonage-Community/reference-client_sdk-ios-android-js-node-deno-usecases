package com.example.vonage.chatsampleapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.vonage.clientcore.core.api.models.ConversationId
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddConversationViewModel @Inject constructor(
    private val clientManager: ChatClientManager
) : ViewModel() {
    private val _events = MutableSharedFlow<Event>()
    val events = _events.asSharedFlow()

    var showProgress by mutableStateOf(false)
        private set

    fun createConversationAndJoin(name: String, displayName: String?){
        showProgress = true
        viewModelScope.launch {
            try {
                val conversationId = clientManager.createConversation(name, displayName)
                clientManager.joinConversation(conversationId)
                _events.emit(Event.Success)
            } catch (error: Exception){
                _events.emit(
                    Event.ErrorCreatingConversation(error.message ?: "Unknown Error")
                )
            }
            showProgress = false
        }
    }

    fun joinConversation(conversationId: ConversationId){
        showProgress = true
        viewModelScope.launch {
            try {
                clientManager.joinConversation(conversationId)
                _events.emit(Event.Success)
            } catch (error: Exception){
                _events.emit(
                    Event.ErrorJoiningConversation(error.message ?: "Unknown Error")
                )
            }
            showProgress = false
        }
    }

    sealed class Event {
        data class ErrorCreatingConversation(val error: String) : Event()
        data class ErrorJoiningConversation(val error: String) : Event()
        object Success: Event()
    }
}