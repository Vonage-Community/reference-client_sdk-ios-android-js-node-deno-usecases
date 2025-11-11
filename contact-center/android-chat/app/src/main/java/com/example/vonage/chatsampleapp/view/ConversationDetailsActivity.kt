package com.example.vonage.chatsampleapp.view

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.paging.PagingData
import androidx.paging.compose.LazyPagingItems
import androidx.paging.compose.collectAsLazyPagingItems
import coil.compose.AsyncImage
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.utils.convertUTCToDateAndTime
import com.example.vonage.chatsampleapp.utils.displayName
import com.example.vonage.chatsampleapp.utils.showToast
import com.example.vonage.chatsampleapp.view.ui.composables.ConfirmationDialog
import com.example.vonage.chatsampleapp.view.ui.composables.CustomList
import com.example.vonage.chatsampleapp.view.ui.composables.MemberItem
import com.example.vonage.chatsampleapp.view.ui.composables.TopAppBarActionButton
import com.example.vonage.chatsampleapp.view.ui.theme.ChatSampleAppTheme
import com.example.vonage.chatsampleapp.view.ui.theme.DarkRed
import com.example.vonage.chatsampleapp.viewmodel.ConversationDetailsViewModel
import com.vonage.clientcore.core.api.models.ChannelType
import com.vonage.clientcore.core.api.models.Member
import com.vonage.clientcore.core.api.models.Username
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch

@AndroidEntryPoint
class ConversationDetailsActivity : ComponentActivity() {
    private val viewModel: ConversationDetailsViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        subscribeToEvents()
        setContent {
            ChatSampleAppTheme {
                val conversationName = viewModel.conversation.displayName()
                val conversationId = viewModel.conversation.id
                val hasJoinedConversation = viewModel.hasJoinedConversation
                val username = viewModel.user.name
                val membersList = viewModel.membersPagingFlow.collectAsLazyPagingItems()
                val isRefreshing = viewModel.isRefreshing
                val conversationImageUrl = viewModel.conversation.imageUrl?.takeUnless { it.isBlank() }
                val creationDate = viewModel.conversation.timestamp.created?.let {
                    convertUTCToDateAndTime(it)
                } ?: String()
                // Get Conversation Details
                LaunchedEffect(true){
                    val conversationDetails = viewModel.getConversationDetails()
                    // Possible use: handle Custom Data
                    conversationDetails?.properties?.customData
                }
                ConversationDetailsScreen(
                    conversationName,
                    conversationId,
                    hasJoinedConversation,
                    username,
                    membersList,
                    isRefreshing,
                    conversationImageUrl,
                    creationDate
                )
            }
        }
    }

    @Composable
    fun ConversationDetailsScreen(
        conversationName: String,
        conversationId: String,
        hasJoinedConversation: Boolean,
        username: Username,
        membersList : LazyPagingItems<Member>,
        isRefreshing: Boolean,
        conversationImageUrl: String?,
        creationDate: String
    ){
        Scaffold(
            topBar = { TopAppBar() },
            content = { padding -> ConversationDetailsView(
                padding = padding,
                hasJoinedConversation = hasJoinedConversation,
                username = username,
                conversationName = conversationName,
                conversationId = conversationId,
                membersList = membersList,
                isRefreshing = isRefreshing,
                conversationImageUrl = conversationImageUrl,
                creationDate = creationDate
            ) },
        )
    }

    @Composable
    fun ConversationDetailsView(
        padding: PaddingValues,
        hasJoinedConversation: Boolean,
        username: Username,
        conversationImageUrl: String?,
        conversationName: String,
        conversationId: String,
        creationDate: String,
        membersList: LazyPagingItems<Member>,
        isRefreshing: Boolean
    ){
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            ConversationInfoView(
                conversationId = conversationId,
                conversationName = conversationName,
                creationDate = creationDate,
                conversationImageUrl = conversationImageUrl
            )

            MembersList(
                modifier = Modifier.weight(1f),
                username = username,
                membersList = membersList,
                isRefreshing = isRefreshing
            )

            InviteUserSection { invitedUsername ->
                viewModel.inviteUser(invitedUsername)
            }

            JoinLeaveSection(
                hasJoinedConversation,
                onLeaveConversation = { viewModel.leaveConversation() },
                onJoinConversation = { viewModel.joinConversation() }
            )
        }
    }

    @OptIn(ExperimentalFoundationApi::class)
    @Composable
    fun ConversationInfoView(
        conversationId: String,
        conversationName: String,
        creationDate: String,
        conversationImageUrl: String? = null
    ){
        Box(
            modifier = Modifier
                .size(120.dp)
                .clickable { /* Perform action when image is clicked */ }
                .padding(16.dp)
                .clip(CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            AsyncImage(
                model = conversationImageUrl,
                modifier = Modifier.fillMaxSize(),
                contentDescription = "$conversationName image",
                error = painterResource(R.drawable.group_icon),
            )
        }

        Text(
            text = conversationName,
            modifier = Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.h5
        )

        val clipboardManager: ClipboardManager = LocalClipboardManager.current

        Text(
            text = conversationId,
            modifier = Modifier
                .padding(top = 4.dp)
                .combinedClickable (
                    onClick = {},
                    onLongClick = {
                        clipboardManager.setText(AnnotatedString(text = conversationId))
                        showToast("Conversation ID Copied")
                    }
                )
                .border(BorderStroke(1.dp, Color.Gray), shape = CircleShape)
                .padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.body2
        )
        Text(
            text = "Created: $creationDate",
            modifier = Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.body2
        )
    }

    @Composable
    fun MembersList(
        modifier: Modifier = Modifier,
        username: Username,
        membersList: LazyPagingItems<Member>,
        isRefreshing: Boolean
    ){
        Text(
            text = "Members (${membersList.itemCount})",
            modifier = Modifier.padding(top = 8.dp),
            style = MaterialTheme.typography.h6
        )

        CustomList(
            modifier = modifier,
            lazilyPagedList = membersList,
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.refreshData() }
        ){ member ->
            var imageUrl: String? by remember { mutableStateOf(null) }
            var memberChannel: ChannelType? by remember { mutableStateOf(null) }
            // Get User
            LaunchedEffect(member){
                val user = viewModel.getUser(member.user?.name)
                user?.imageUrl?.takeUnless { it.isBlank() }?.let {
                    imageUrl = it
                }
            }
            // Get Member
            LaunchedEffect(member){
                val memberDetails = viewModel.getMember(member.id)
                memberDetails?.channel?.type?.let {
                    memberChannel = it
                }
            }

            val clipboardManager: ClipboardManager = LocalClipboardManager.current

            MemberItem(
                userImageUrl = imageUrl,
                username = member.user!!.name,
                displayName = member.user!!.displayName(),
                memberId = member.id,
                memberChannel = memberChannel,
                memberState = member.state,
                isYourMember = member.user?.name == username,
                onLongClick = {
                    clipboardManager.setText(AnnotatedString(text = member.id))
                    showToast("Member ID Copied")
                }
            )
        }
    }

    @Composable
    fun InviteUserSection(
        onInviteUser: (String) -> Unit
    ){
        val focusManager = LocalFocusManager.current
        var invitedUsername by remember {
            mutableStateOf(String())
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = invitedUsername,
                onValueChange = { invitedUsername = it },
                singleLine = true,
                modifier = Modifier.weight(1f),
                placeholder = { Text(stringResource(R.string.invited_username_hint)) },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(
                    onDone = { focusManager.clearFocus() }
                )
            )
            Button(
                onClick = { onInviteUser(invitedUsername); focusManager.clearFocus() },
                modifier = Modifier.padding(start = 8.dp)
            ) {
                Text(stringResource(R.string.invite_to_conversation_text))
            }
        }
    }

    @Composable
    fun JoinLeaveSection(
        hasJoinedConversation: Boolean,
        onLeaveConversation: () -> Unit,
        onJoinConversation: () -> Unit
    ){
        var showDialog by remember { mutableStateOf(false) }
        if(hasJoinedConversation){
            Button(
                onClick = { showDialog = true },
                colors = ButtonDefaults.buttonColors(backgroundColor = DarkRed)
            ){
                Text(
                    text = stringResource(R.string.leave_conversation_text),
                    color = Color.White
                )
            }
        }else {
            Button(onClick = onJoinConversation){
                Text(stringResource(R.string.join_conversation_text))
            }
        }
        if(showDialog){
            ConfirmationDialog(
                actionName = "Leave",
                itemType = "Conversation",
                onConfirm = {
                    // Handle leave confirmation
                    onLeaveConversation()
                    showDialog = false // Dismiss the dialog
                },
                onDismiss = { showDialog = false } // Dismiss the dialog without deleting
            )
        }
    }

    @Composable
    fun TopAppBar(){
        TopAppBar(
            title = {
                Text(
                    text = "Details"
                )
            },
            navigationIcon = {
                TopAppBarActionButton(
                    imageVector = Icons.Filled.ArrowBack,
                    description = stringResource(R.string.arrow_back_description)
                ) { finish() }
            }
        )
    }
    private fun subscribeToEvents(){
        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.events.collect { event ->
                    when(event){
                        is ConversationDetailsViewModel.Event.ErrorInviteToConversation -> {
                            val error = event.error
                            showToast("Error Inviting: $error")
                        }
                        is ConversationDetailsViewModel.Event.ErrorJoinConversation -> {
                            val error = event.error
                            showToast("Error Joining: $error")
                        }
                        is ConversationDetailsViewModel.Event.ErrorLeaveConversation -> {
                            val error = event.error
                            showToast("Error Leaving: $error")
                        }
                        is ConversationDetailsViewModel.Event.SuccessInviteToConversation -> {
                            val username = event.invited
                            showToast("$username Invited")
                        }
                        ConversationDetailsViewModel.Event.SuccessLeaveConversation -> {
                            finish()
                        }
                        ConversationDetailsViewModel.Event.SuccessJoinConversation -> {}
                    }
                }
            }
        }
    }

    @Preview(showBackground = true)
    @Composable
    fun DefaultPreview() {
        ChatSampleAppTheme {
            ConversationDetailsScreen(
                "Test Conversation",
                "123",
                true,
                "Test User",
                flowOf(PagingData.empty<Member>()).collectAsLazyPagingItems(),
                false,
                null,
                "Today at 12:01 PM"
            )
        }
    }
}


