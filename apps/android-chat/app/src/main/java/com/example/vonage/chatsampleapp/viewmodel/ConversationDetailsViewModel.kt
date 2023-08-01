package com.example.vonage.chatsampleapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.*
import androidx.paging.InvalidatingPagingSourceFactory
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.cachedIn
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.example.vonage.chatsampleapp.utils.Constants
import com.example.vonage.chatsampleapp.view.ChatActivity
import com.vonage.clientcore.core.api.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ConversationDetailsViewModel @Inject constructor(
    private val clientManager: ChatClientManager,
    private val membersFactory: InvalidatingPagingSourceFactory<Int, Member>,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    val conversation = clientManager.currentConversation
    val user = clientManager.currentUser

    private val _events = MutableSharedFlow<Event>()
    val events = _events.asSharedFlow()

    val membersPagingFlow = Pager(
        config = PagingConfig(Constants.PAGE_SIZE),
        pagingSourceFactory = membersFactory
    ).flow.cachedIn(viewModelScope)

    var isRefreshing by mutableStateOf(false)
        private set

    var hasJoinedConversation : Boolean by mutableStateOf(savedStateHandle[ChatActivity.HAS_JOINED]!!)
        private set

    private val clearSubscription = clientManager.setConversationEventListener { event ->
        if(event.conversationId != conversation.id) return@setConversationEventListener
        when(event){
            is MemberInvitedConversationEvent,
            is MemberJoinedConversationEvent -> {
                refreshData()
            }
            is MemberLeftConversationEvent -> {
                if(event.body.user.name != user.name){
                    refreshData()
                }
            }
            else -> {}
        }
    }

    fun inviteUser(username: Username){
        username.takeUnless { it.isBlank() } ?: return
        val formattedUsername = username.trim()
        viewModelScope.launch {
            try {
                clientManager.inviteToConversation(conversation.id, formattedUsername)
                _events.emit(Event.SuccessInviteToConversation(formattedUsername))
            }catch (e: Exception){
                _events.emit(Event.ErrorInviteToConversation(e.message ?: "Unknown Error"))
            }
        }
    }

    fun joinConversation(){
        viewModelScope.launch {
            try {
                clientManager.joinConversation(conversation.id)
                hasJoinedConversation = true
                _events.emit(Event.SuccessJoinConversation)
            } catch (e: Exception){
                _events.emit(Event.ErrorJoinConversation(e.message ?: "Unknown Error"))
            }
        }
    }

    fun leaveConversation(){
        viewModelScope.launch {
            try {
                clientManager.leaveConversation(conversation.id)
                hasJoinedConversation = false
                _events.emit(Event.SuccessLeaveConversation)
            } catch (e: Exception){
                _events.emit(Event.ErrorLeaveConversation(e.message ?: "Unknown Error"))
            }
        }
    }

    suspend fun getUser(username: Username?) : User? {
        return try {
            clientManager.getUser(username!!)
        }catch (_: Exception){
            null
        }
    }

    suspend fun getConversationDetails() : Conversation?{
        return try {
            clientManager.getConversation(conversation.id)
        }catch (_: Exception){
            null
        }
    }

    suspend fun getMember(memberId: MemberId) : Member? {
        return try {
            clientManager.getMember(conversation.id, memberId)
        } catch (_: Exception){
            null
        }
    }

    fun refreshData(){
        membersFactory.invalidate()
    }

    override fun onCleared() {
        clearSubscription()
    }

    sealed class Event {
        data class ErrorJoinConversation(val error: String) : Event()
        object SuccessJoinConversation: Event()
        data class ErrorLeaveConversation(val error: String) : Event()
        object SuccessLeaveConversation: Event()
        data class ErrorInviteToConversation(val error: String): Event()
        data class SuccessInviteToConversation(val invited: Username): Event()
    }
}