package com.example.vonage.chatsampleapp.viewmodel

import android.os.Bundle
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.*
import androidx.paging.InvalidatingPagingSourceFactory
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.cachedIn
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.example.vonage.chatsampleapp.utils.Constants
import com.example.vonage.chatsampleapp.view.ConversationDetailsActivity
import com.vonage.clientcore.core.api.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val clientManager: ChatClientManager,
    eventsFactory: InvalidatingPagingSourceFactory<Int, ConversationEvent>
) : ViewModel() {
    val conversation = clientManager.currentConversation
    val user = clientManager.currentUser

    var hasJoinedConversation by mutableStateOf(conversation.memberState == MemberState.JOINED)
        private set

    private val _events = MutableSharedFlow<Event>()
    val events = _events.asSharedFlow()

    val eventsPagingFlow = Pager(
        config = PagingConfig(Constants.PAGE_SIZE),
        pagingSourceFactory = eventsFactory
    ).flow.cachedIn(viewModelScope)

    private val _newEventsList = mutableStateListOf<ConversationEvent>()
    val newEventsList: List<ConversationEvent> = _newEventsList

    private val clearSubscription = clientManager.setConversationEventListener { event ->
        if(event.conversationId != conversation.id) return@setConversationEventListener
        _newEventsList.add(0, event)
        // If Leave/Join is triggered by Conversation Details View
        // Then emit the appropriate event
        if(event is MemberLeftConversationEvent && user.name == event.body.user.name && hasJoinedConversation){
            viewModelScope.launch {
                onConversationLeft()
            }
        }
        if(event is MemberJoinedConversationEvent && user.name == event.body.user.name && !hasJoinedConversation){
            viewModelScope.launch {
                onConversationJoined()
            }
        }
    }

    fun joinConversation(){
        viewModelScope.launch {
            try {
                clientManager.joinConversation(conversation.id)
                onConversationJoined()
            } catch (e: Exception){
                _events.emit(Event.ErrorJoinConversation(e.message ?: "Unknown Error"))
            }
        }
    }

    fun sendMessage(text: String){
        text.takeUnless { it.isBlank() } ?: return
        viewModelScope.launch {
            try {
                clientManager.sendTextMessage(conversation.id, text)
                _events.emit(Event.SuccessSendMessage)
            } catch (e: Exception){
                _events.emit(Event.ErrorSendMessage(e.message ?: "Unknown Error"))
            }
        }
    }

    fun leaveConversation(){
        viewModelScope.launch {
            try {
                clientManager.leaveConversation(conversation.id)
                onConversationLeft()
            } catch (e: Exception){
                _events.emit(Event.ErrorLeaveConversation(e.message ?: "Unknown Error"))
            }
        }
    }

    // Sending current joining state to Details Activity
    fun intentExtras(): Bundle {
        return Bundle().apply {
            putSerializable(ConversationDetailsActivity.HAS_JOINED, hasJoinedConversation)
        }
    }

    private suspend fun onConversationJoined(){
        hasJoinedConversation = true
        _events.emit(Event.SuccessJoinConversation)
    }

    private suspend fun onConversationLeft(){
        hasJoinedConversation = false
        _events.emit(Event.SuccessLeaveConversation)
    }

    override fun onCleared() {
        clearSubscription()
    }

    sealed class Event {
        data class ErrorJoinConversation(val error: String) : Event()
        object SuccessJoinConversation: Event()
        data class ErrorLeaveConversation(val error: String) : Event()
        object SuccessLeaveConversation: Event()
        data class ErrorSendMessage(val error: String): Event()
        object SuccessSendMessage: Event()
    }
}