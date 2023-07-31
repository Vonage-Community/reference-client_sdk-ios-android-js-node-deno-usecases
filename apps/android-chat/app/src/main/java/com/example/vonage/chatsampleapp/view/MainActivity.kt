package com.example.vonage.chatsampleapp.view

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.ExitToApp
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.paging.PagingData
import androidx.paging.compose.*
import com.example.vonage.chatsampleapp.view.ui.theme.ChatSampleAppTheme
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.push.NotificationHelper
import com.example.vonage.chatsampleapp.utils.*
import com.example.vonage.chatsampleapp.utils.navigateToChatActivity
import com.example.vonage.chatsampleapp.utils.navigateToCreateConversationActivity
import com.example.vonage.chatsampleapp.utils.navigateToLoginActivity
import com.example.vonage.chatsampleapp.utils.showToast
import com.example.vonage.chatsampleapp.view.ui.composables.*
import com.example.vonage.chatsampleapp.viewmodel.MainViewModel
import com.vonage.clientcore.core.api.models.Conversation
import com.vonage.clientcore.core.api.models.MemberState
import com.vonage.clientcore.core.api.models.Username
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
        subscribeToEvents()
        setContent {
            ChatSampleAppTheme {
                val username = viewModel.user.displayName()
                val conversationsList = viewModel.conversationPagingFlow.collectAsLazyPagingItems()
                val isRefreshing = viewModel.isRefreshing
                MainScreen(username, conversationsList, isRefreshing)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if(!viewModel.isLoggedIn){
            navigateToLoginActivity()
        }
    }

    private fun handleIntent(intent: Intent){
        val conversationId = intent.getStringExtra(NotificationHelper.CONVERSATION_ID) ?: return
        viewModel.selectConversation(conversationId){
            navigateToChatActivity(
                Bundle().apply {
                    putBoolean(ChatActivity.HAS_JOINED, true)
                }
            )
        }
    }

    @Composable
    fun MainScreen(
        username: Username,
        conversationsList: LazyPagingItems<Conversation>,
        isRefreshing: Boolean
    ){
        Scaffold(
            topBar = { TopAppBar(username) },
            floatingActionButtonPosition = FabPosition.End,
            floatingActionButton = { FloatingActionButton(
                onClick = { navigateToCreateConversationActivity() }
            ){
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = stringResource(R.string.create_conversation_label)
                )
            } },
            content = { padding -> ConversationsList(padding, conversationsList, isRefreshing) },
        )
    }

    @Composable
    fun ConversationsList(
        padding: PaddingValues,
        conversationsList: LazyPagingItems<Conversation>,
        isRefreshing: Boolean
    ){
        CustomList(
            modifier = Modifier
                .padding(padding)
                .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp),
            lazilyPagedList = conversationsList,
            emptyListMessage = stringResource(R.string.no_conversations_found_label),
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.refreshData() }
        ){ conversation ->
            ConversationItem(
                conversationId = conversation.id,
                conversationName = conversation.displayName(),
                conversationImageUrl = conversation.imageUrl?.takeUnless { it.isBlank() },
                memberState = conversation.memberState ?: MemberState.UNKNOWN,
                onClick = {
                            viewModel.selectConversation(conversation)
                            navigateToChatActivity()
                          },
                onDelete = { viewModel.deleteConversation(conversation.id) }
            )
        }
    }

    @Composable
    fun TopAppBar(username: Username){
        TopAppBar(
            title = {
                Text(
                    text = username
                )
            },
            actions = {
                TopAppBarActionButton(
                    imageVector = Icons.Outlined.ExitToApp,
                    description = stringResource(R.string.logout_label)
                ){
                    viewModel.logout()
                }
            }
        )
    }

    private fun subscribeToEvents(){
        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED){
                viewModel.events.collect { event ->
                    when(event){
                        is MainViewModel.Event.ErrorLogOut -> {
                            val error = event.error
                            showToast("Logout Failed: $error")
                        }
                        MainViewModel.Event.SuccessLogOut -> {
                            showToast("Logged Out")
                            navigateToLoginActivity()
                        }

                        is MainViewModel.Event.ErrorDeleteConversation -> {
                            val error = event.error
                            showToast("Delete Failed: $error")
                        }
                        MainViewModel.Event.SuccessDelete -> {
                            showToast("Conversation Deleted")
                        }

                        is MainViewModel.Event.SessionError -> {
                            val error = event.error
                            showToast("Session Error: $error")
                        }

                        is MainViewModel.Event.ErrorRefreshSession -> {
                            val error = event.error
                            showToast("Session Refresh Failed: $error")
                            navigateToLoginActivity()
                        }

                        MainViewModel.Event.SuccessRefreshSession -> {
                            showToast("Session successfully refreshed")
                        }
                    }
                }
            }
        }
    }

    @Preview(showBackground = true)
    @Composable
    fun DefaultPreview() {
        ChatSampleAppTheme(darkTheme = true) {
            MainScreen(
                "Test User",
                flowOf(PagingData.empty<Conversation>()).collectAsLazyPagingItems(),
                false
            )
        }
    }
}