package com.example.vonage.chatsampleapp.view

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Send
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.paging.PagingData
import androidx.paging.compose.LazyPagingItems
import androidx.paging.compose.collectAsLazyPagingItems
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.utils.convertUTCToDate
import com.example.vonage.chatsampleapp.utils.displayName
import com.example.vonage.chatsampleapp.utils.navigateToDetailsActivity
import com.example.vonage.chatsampleapp.utils.showToast
import com.example.vonage.chatsampleapp.view.ui.composables.*
import com.example.vonage.chatsampleapp.viewmodel.ChatViewModel
import com.example.vonage.chatsampleapp.view.ui.theme.ChatSampleAppTheme
import com.vonage.clientcore.core.api.models.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch

@AndroidEntryPoint
class ChatActivity : ComponentActivity() {
    private val viewModel: ChatViewModel by viewModels()
    companion object {
        const val HAS_JOINED = "HAS_JOINED"
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        subscribeToEvents()
        setContent {
            ChatSampleAppTheme {
                val eventsList = viewModel.eventsPagingFlow.collectAsLazyPagingItems()
                val conversationName = viewModel.conversation.displayName()
                val hasJoinedConversation = viewModel.hasJoinedConversation
                val username = viewModel.user.name
                val newEventsList = viewModel.newEventsList
                ChatScreen(conversationName, hasJoinedConversation, username, eventsList, newEventsList)
            }
        }
    }

    @Composable
    fun ChatScreen(
        conversationName: String,
        hasJoinedConversation: Boolean,
        username: Username,
        eventsList: LazyPagingItems<ConversationEvent>,
        newEventsList: List<ConversationEvent>
    ){
        Scaffold(
            topBar = { TopAppBar(conversationName, hasJoinedConversation) },
            content = { padding -> ChatView(padding, hasJoinedConversation, username, eventsList, newEventsList) },
        )
    }

    @Composable
    fun ChatView(
        padding: PaddingValues,
        hasJoinedConversation: Boolean,
        username: Username,
        eventsList: LazyPagingItems<ConversationEvent>,
        newEventsList: List<ConversationEvent>
    ){
        var messageText by remember {
            mutableStateOf(String())
        }

        Column(
            modifier = Modifier
                .padding(padding)
                .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            EventsList(
                modifier = Modifier
                    .weight(1f)
                    .padding(bottom = 10.dp),
                username = username,
                eventsList = eventsList,
                newEventsList = newEventsList
            )
            if(hasJoinedConversation){
                OutlinedTextField(
                    modifier = Modifier
                        .fillMaxWidth(),
                    placeholder = {
                        Text(stringResource(R.string.text_message_hint))
                    },
                    value = messageText,
                    onValueChange = { messageText = it },
                    shape = RoundedCornerShape(25.dp),
                    maxLines = 6,
                    trailingIcon = {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = stringResource(R.string.send_message_text),
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable {
                                    viewModel.sendMessage(messageText)
                                    messageText = String()
                                }
                        )
                    }
                )
            }else{
                Button(
                    onClick = { viewModel.joinConversation() },
                    modifier = Modifier
                        .fillMaxWidth()
                ) {
                    Text(text = stringResource(R.string.join_conversation_text))
                }
            }
        }
    }

    @Composable
    fun EventsList(
        modifier: Modifier = Modifier,
        username: Username,
        eventsList: LazyPagingItems<ConversationEvent>,
        newEventsList: List<ConversationEvent>
    ){
        CustomList(
            modifier = modifier,
            lazilyPagedList = eventsList,
            localList = newEventsList,
            reverseLayout = true,
            verticalArrangement = Arrangement.Top,
            groupByKey = { event -> convertUTCToDate(event.timestamp) },
            labelFactory = { key -> ConversationDateLabel(key) },
            isRefreshEnabled = false
        ){ event ->
            ConversationEventItem(event, username)
        }
    }

    @Composable
    fun TopAppBar(conversationName: String, hasJoinedConversation: Boolean){
        var showMenu by remember { mutableStateOf(false) }
        var showDialog by remember { mutableStateOf(false) }

        TopAppBar(
            title = {
                Text(
                    text = conversationName
                )
            },
            navigationIcon = {
                TopAppBarActionButton(
                    imageVector = Icons.Filled.ArrowBack,
                    description = stringResource(R.string.arrow_back_description)
                ) { finish() }
            },
            actions = {
                IconButton(onClick = { showMenu = !showMenu }) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = null
                    )
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(onClick = {
                        navigateToDetailsActivity(viewModel.intentExtras())
                        showMenu = false
                    }) {
                        Text(stringResource(R.string.conversation_details_text))
                    }
                    if(hasJoinedConversation){
                        DropdownMenuItem(onClick = { showDialog = true }) {
                            Text(stringResource(R.string.leave_conversation_text))
                        }
                    }
                }
                if(showDialog){
                    ConfirmationDialog(
                        actionName = "Leave",
                        itemType = "Conversation",
                        onConfirm = {
                            // Handle leave confirmation
                            viewModel.leaveConversation()
                            showDialog = false // Dismiss the dialog
                            showMenu = false
                        },
                        onDismiss = { showDialog = false } // Dismiss the dialog without deleting
                    )
                }
            }
        )
    }

    private fun subscribeToEvents(){
        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED){
                viewModel.events.collect { event ->
                    when(event){
                        is ChatViewModel.Event.ErrorSendMessage -> {
                            val error = event.error
                            showToast("Error Sending: $error")
                        }
                        is ChatViewModel.Event.ErrorJoinConversation -> {
                            val error = event.error
                            showToast("Error Joining: $error")
                        }
                        is ChatViewModel.Event.ErrorLeaveConversation -> {
                            val error = event.error
                            showToast("Error Leaving: $error")
                        }
                        ChatViewModel.Event.SuccessLeaveConversation -> {
                            showToast("Conversation Left")
                            finish()
                        }
                        ChatViewModel.Event.SuccessJoinConversation,
                        ChatViewModel.Event.SuccessSendMessage -> {}
                    }
                }
            }
        }
    }

    @Preview(showBackground = true)
    @Composable
    fun DefaultPreview() {
        ChatSampleAppTheme(darkTheme = false) {
            ChatScreen(
                "Test Conversation",
                false,
                "Test User",
                flowOf(PagingData.empty<ConversationEvent>()).collectAsLazyPagingItems(),
                listOf()
            )
        }
    }
}