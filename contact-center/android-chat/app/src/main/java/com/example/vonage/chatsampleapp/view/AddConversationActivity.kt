package com.example.vonage.chatsampleapp.view

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.utils.Constants
import com.example.vonage.chatsampleapp.view.ui.composables.CustomOutlinedTextField
import com.example.vonage.chatsampleapp.view.ui.theme.ChatSampleAppTheme
import com.example.vonage.chatsampleapp.view.ui.composables.TopAppBarActionButton
import com.example.vonage.chatsampleapp.utils.showToast
import com.example.vonage.chatsampleapp.viewmodel.AddConversationViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class AddConversationActivity : ComponentActivity() {
    private val viewModel : AddConversationViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        subscribeToEvents()
        setContent {
            ChatSampleAppTheme {
                val showProgress = viewModel.showProgress
                AddConversationScreen(showProgress)
            }
        }
    }

    @Composable
    fun AddConversationScreen(showProgress: Boolean = false){
        Scaffold(
            topBar = { TopAppBar() },
            content = { padding -> FormView(padding, showProgress)},
        )
    }

    @Composable
    fun TopAppBar(){
        TopAppBar(
            title = {
                Text(
                    text = stringResource(R.string.add_conversation_label)
                )
            },
            navigationIcon = {
                TopAppBarActionButton(
                    imageVector = Icons.Filled.ArrowBack,
                    description = stringResource(R.string.arrow_back_description)
                ){ finish() }
            }
        )
    }

    @Composable
    fun FormView(
        padding: PaddingValues,
        showProgress: Boolean
    ){
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 10.dp, bottom = 10.dp)
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Top,
        ){
            CreateConversationSection()
            Spacer(Modifier.height(10.dp))
            JoinConversationSection()
            if(showProgress){
                CircularProgressIndicator(
                    modifier = Modifier
                        .wrapContentSize()
                )
            }
        }
    }

    @Composable
    fun CreateConversationSection(){
        val focusManager = LocalFocusManager.current

        var name by remember { mutableStateOf("") }
        var displayName by remember { mutableStateOf("") }

        val nameEmptyError = stringResource(R.string.no_conversation_name_error)
        val nameInvalidError = stringResource(R.string.invalid_conversation_name_error)

        val nameLabel = stringResource(R.string.conversation_name_hint)
        val displayNameLabel = stringResource(R.string.conversation_display_name_hint)

        val buttonText = stringResource(R.string.create_conversation_and_join_label)

        var validateNameNotEmpty by remember { mutableStateOf(true) }
        var validateNameValid by remember { mutableStateOf(true) }



        val validateData : (String) -> Boolean = remember {
            { name ->
                validateNameNotEmpty = name.isNotBlank()
                validateNameValid = name.matches(Constants.CONVERSATION_NAME_REGEX)
                validateNameNotEmpty && validateNameValid
            }
        }

        val submitForm : (String, String) -> Unit = remember {
            { name, displayName ->
                if(validateData(name)) {
                    viewModel.createConversationAndJoin(name, displayName)
                }
            }
        }
        Text(
            text = stringResource(R.string.new_conversation_label),
            style = MaterialTheme.typography.h6,
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(top = 10.dp, bottom = 10.dp)
        )
        CustomOutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = nameLabel,
            showError = !validateNameNotEmpty || !validateNameValid,
            errorMessage = if(!validateNameNotEmpty) nameEmptyError else nameInvalidError,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) }
            )
        )
        CustomOutlinedTextField(
            value = displayName,
            onValueChange = { displayName = it },
            label = displayNameLabel,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { focusManager.clearFocus() }
            )
        )
        Button(
            onClick = { submitForm(name, displayName) },
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(10.dp)
        ){
            Text(
                text = buttonText
            )
        }
    }

    @Composable
    fun JoinConversationSection(){
        val focusManager = LocalFocusManager.current

        var conversationId by remember { mutableStateOf("") }

        val idEmptyError = stringResource(R.string.no_conversation_id_error)
        val idInvalidError = stringResource(R.string.invalid_conversation_id_error)

        val conversationIdLabel = stringResource(R.string.conversation_id_hint)

        val buttonText = stringResource(R.string.join_conversation_text)

        var validateIdNotEmpty by remember { mutableStateOf(true) }
        var validateIdValid by remember { mutableStateOf(true) }

        val validateData : (String) -> Boolean = remember {
            { conversationId ->
                validateIdNotEmpty = conversationId.isNotBlank()
                validateIdValid = conversationId.matches(Constants.CONVERSATION_ID_REGEX)
                validateIdNotEmpty && validateIdValid
            }
        }

        val submitForm : (String) -> Unit = remember {
            { conversationId ->
                val formattedId = conversationId.trim()
                if(validateData(formattedId)) {
                    viewModel.joinConversation(formattedId)
                }
            }
        }

        Text(
            text = stringResource(R.string.existing_conversation_label),
            style = MaterialTheme.typography.h6,
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(top = 10.dp, bottom = 10.dp)
        )
        CustomOutlinedTextField(
            value = conversationId,
            onValueChange = { conversationId = it },
            label = conversationIdLabel,
            showError = !validateIdNotEmpty || !validateIdValid,
            errorMessage = if(!validateIdNotEmpty) idEmptyError else idInvalidError,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { focusManager.clearFocus() }
            )
        )
        Button(
            onClick = { submitForm(conversationId) },
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(10.dp)
        ){
            Text(
                text = buttonText
            )
        }
    }

    private fun subscribeToEvents(){
        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED){
                viewModel.events.collect { event ->
                    when(event){
                        is AddConversationViewModel.Event.ErrorCreatingConversation -> {
                            showToast("Creation Failed: ${event.error}")
                        }
                        is AddConversationViewModel.Event.ErrorJoiningConversation -> {
                            showToast("Join Failed: ${event.error}")
                        }
                        AddConversationViewModel.Event.Success -> {
                            showToast("Conversation Added")
                            finish()
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
            AddConversationScreen()
        }
    }
}