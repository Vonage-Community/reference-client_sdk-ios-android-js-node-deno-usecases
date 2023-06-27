package com.example.vonage.chatsampleapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.InvalidatingPagingSourceFactory
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.cachedIn
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.example.vonage.chatsampleapp.utils.Constants
import com.vonage.clientcore.core.api.SessionErrorReason
import com.vonage.clientcore.core.api.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val clientManager: ChatClientManager,
    private val conversationsFactory: InvalidatingPagingSourceFactory<Int, Conversation>,
) : ViewModel() {
    private val _events = MutableSharedFlow<Event>()
    val events = _events.asSharedFlow()

    val user = clientManager.currentUser

    val conversationPagingFlow = Pager(
        config = PagingConfig(Constants.PAGE_SIZE),
        pagingSourceFactory = conversationsFactory
    ).flow.cachedIn(viewModelScope)

    var isRefreshing by mutableStateOf(false)
        private set

    val isLoggedIn: Boolean
        get() = !clientManager.sessionId.isNullOrEmpty()

    private val clearEventSubscription = clientManager.setConversationEventListener { event: ConversationEvent ->
        when{
            event is MemberInvitedConversationEvent && user.name == event.body.invitee.name ||
            event is MemberLeftConversationEvent && user.name == event.body.user.name ||
            event is MemberJoinedConversationEvent && user.name == event.body.user.name -> {
                refreshData()
            }
        }
    }

    private val clearSessionErrorSubscription = clientManager.setSessionErrorListener { reason: SessionErrorReason ->
        val message = when(reason){
            SessionErrorReason.TokenExpired -> "Token Expired"
            SessionErrorReason.TransportClosed -> "Transport Closed"
            SessionErrorReason.PingTimeout -> "Ping Timeout"
        }
        viewModelScope.launch {
            _events.emit(Event.SessionError(message))
            try {
                clientManager.refreshSession()
                _events.emit(Event.SuccessRefreshSession)
            } catch (error: Exception){
                _events.emit(Event.ErrorRefreshSession(error.message ?: "Unknown Error"))
            }
        }
    }

    fun logout(){
        viewModelScope.launch {
            try {
                clientManager.logout()
                _events.emit(Event.SuccessLogOut)
            }catch (error: Exception){
                _events.emit(Event.ErrorLogOut(error.message ?: "Unknown Error"))
            }
        }
    }

    fun refreshData(){
        conversationsFactory.invalidate()
    }

    fun deleteConversation(conversationId: ConversationId){
        viewModelScope.launch {
            try {
                clientManager.deleteConversation(conversationId)
                _events.emit(Event.SuccessDelete)
                refreshData()
            } catch(error:Exception){
                _events.emit(Event.ErrorDeleteConversation(error.message ?: "Unknown Error"))
            }
        }
    }

    fun selectConversation(conversation: Conversation){
        clientManager.currentConversation = conversation
    }

    override fun onCleared() {
        clearEventSubscription()
        clearSessionErrorSubscription()
    }

    sealed class Event {
        data class ErrorLogOut(val error: String) : Event()
        object SuccessLogOut: Event()
        data class ErrorDeleteConversation(val error: String) : Event()
        object SuccessDelete: Event()
        data class SessionError(val error: String) : Event()
        data class ErrorRefreshSession(val error: String) : Event()
        object SuccessRefreshSession : Event()
    }

}