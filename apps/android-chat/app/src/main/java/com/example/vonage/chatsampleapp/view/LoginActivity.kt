package com.example.vonage.chatsampleapp.view

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.vonage.chatsampleapp.BuildConfig
import com.example.vonage.chatsampleapp.R
import com.example.vonage.chatsampleapp.view.ui.theme.ChatSampleAppTheme
import com.example.vonage.chatsampleapp.utils.navigateToMainActivity
import com.example.vonage.chatsampleapp.utils.showToast
import com.example.vonage.chatsampleapp.view.ui.composables.LabelledCheckbox
import com.example.vonage.chatsampleapp.viewmodel.LoginViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class LoginActivity : ComponentActivity() {
    private val viewModel: LoginViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if(viewModel.isLoggedIn){
            return navigateToMainActivity()
        }
        subscribeToEvents()
        setContent {
            ChatSampleAppTheme {
                LoginScreen(viewModel.showProgress)
            }
        }
    }

    @Composable
    fun LoginScreen(showProgress: Boolean = false){
        Scaffold(
            topBar = { TopAppBar(
                title = { Text(stringResource(R.string.app_name)) }
            ) },
            content = { padding -> LoginView(padding, showProgress) },
        )
    }

    @Composable
    fun LoginView(padding: PaddingValues, showProgress: Boolean){
        var token by remember {
            mutableStateOf(BuildConfig.VONAGE_API_TOKEN)
        }
        var code by remember {
            mutableStateOf(String())
        }
        var loginWithToken by remember {
            mutableStateOf(true)
        }
        val textFieldValue = if (loginWithToken) token else code
        val textFieldLabel = if (loginWithToken) stringResource(R.string.token_hint) else stringResource(R.string.login_code_hint)
        val onTextFieldValueChange = { newValue: String ->
            if(loginWithToken) token = newValue else code = newValue
        }
        ConstraintLayout(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(start = 20.dp, end = 20.dp)
        ) {
            val (logo, tokenTextField, btnLogin, checkBox, progressBar) = createRefs()
            Image(
                painter = painterResource(id = R.drawable.vonage_logo_svg),
                contentDescription = stringResource(R.string.logo_description),
                modifier = Modifier
                    .height(100.dp)
                    .width(100.dp)
                    .constrainAs(logo){
                        start.linkTo(parent.start)
                        end.linkTo(parent.end)
                        top.linkTo(parent.top, margin = 40.dp)
                    },
                colorFilter = ColorFilter.tint(color = MaterialTheme.colors.primary)
            )
            OutlinedTextField(
                value = textFieldValue,
                textStyle = TextStyle(color = MaterialTheme.colors.primary),
                onValueChange = onTextFieldValueChange,
                label = { Text(text = textFieldLabel) },
                modifier = Modifier
                    .fillMaxWidth()
                    .constrainAs(tokenTextField){
                        start.linkTo(parent.start)
                        end.linkTo(parent.end)
                        top.linkTo(logo.bottom, margin = 10.dp)
                    },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                singleLine = true
            )
            Button(
                onClick = { viewModel.login(token, code, loginWithToken) },
                modifier = Modifier
                    .fillMaxWidth()
                    .constrainAs(btnLogin){
                        start.linkTo(parent.start)
                        end.linkTo(parent.end)
                        top.linkTo(tokenTextField.bottom, margin = 20.dp)
                    }
            ) {
                Text(text = stringResource(R.string.login_text))
            }
            LabelledCheckbox(
                modifier = Modifier
                    .fillMaxWidth()
                    .constrainAs(checkBox){
                        start.linkTo(parent.start)
                        end.linkTo(parent.end)
                        top.linkTo(btnLogin.bottom, margin = 10.dp)
                    },
                label = stringResource(R.string.login_with_token_text),
                isChecked = loginWithToken,
                onCheckedChange = { loginWithToken = it }
            )
            if(showProgress){
                CircularProgressIndicator(
                    modifier = Modifier
                        .constrainAs(progressBar){
                            start.linkTo(parent.start)
                            end.linkTo(parent.end)
                            top.linkTo(checkBox.bottom, margin = 20.dp)
                        }
                )
            }
        }
    }

    private fun subscribeToEvents(){
        lifecycleScope.launch {
            lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED){
                viewModel.loginEvent.collect { event ->
                    when(event){
                        is LoginViewModel.LogInEvent.ErrorLogin -> {
                            val error = event.error
                            showToast("Login Failed: $error")
                        }
                        is LoginViewModel.LogInEvent.Success -> {
                            showToast("Login Successful")
                            navigateToMainActivity()
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
            LoginScreen()
        }
    }
}

