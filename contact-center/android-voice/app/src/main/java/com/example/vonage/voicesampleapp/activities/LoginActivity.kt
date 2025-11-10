package com.example.vonage.voicesampleapp.activities

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.BuildConfig
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.ui.theme.VoiceSampleAppTheme
import com.example.vonage.voicesampleapp.utils.navigateToMainActivity
import com.example.vonage.voicesampleapp.utils.showToast

class LoginActivity : ComponentActivity() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager
    private val defaultToken = BuildConfig.VONAGE_API_TOKEN

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VoiceSampleAppTheme {
                LoginScreen(
                    defaultToken = defaultToken,
                    onLogin = { token, isToken, callback ->
                        performLogin(token, isToken, callback)
                    }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        clientManager.sessionId?.let {
            navigateToMainActivity()
        }
    }

    private fun performLogin(tokenOrCode: String, isToken: Boolean, callback: (Boolean) -> Unit) {
        val onErrorCallback = { error: Exception ->
            showToast(this, "Login Failed: ${error.message}")
            callback(false)
        }
        val onSuccessCallback = { sessionId: String ->
            showToast(this, "Logged in with session ID: $sessionId", Toast.LENGTH_SHORT)
            callback(true)
            navigateToMainActivity()
        }
        if (isToken) {
            clientManager.login(token = tokenOrCode, onErrorCallback, onSuccessCallback)
        } else {
            clientManager.loginWithCode(code = tokenOrCode, onErrorCallback, onSuccessCallback)
        }
    }
}

@Composable
fun LoginScreen(
    defaultToken: String,
    onLogin: (String, Boolean, (Boolean) -> Unit) -> Unit
) {
    var tokenOrCode by remember { mutableStateOf(defaultToken) }
    var loginWithToken by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 32.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Logo
                Image(
                    painter = painterResource(id = R.drawable.vonage_logo_svg),
                    contentDescription = stringResource(R.string.logo_description),
                    modifier = Modifier.size(120.dp),
                    colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Welcome Text
                Text(
                    text = "Welcome",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Sign in to continue",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Text Field
                OutlinedTextField(
                    value = tokenOrCode,
                    onValueChange = { tokenOrCode = it },
                    label = {
                        Text(
                            stringResource(
                                if (loginWithToken) R.string.token_hint
                                else R.string.login_code_hint
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = if (loginWithToken) {
                        PasswordVisualTransformation()
                    } else {
                        VisualTransformation.None
                    },
                    enabled = !isLoading,
                    shape = MaterialTheme.shapes.medium
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Login Button
                Button(
                    onClick = {
                        isLoading = true
                        onLogin(tokenOrCode, loginWithToken) { success ->
                            isLoading = false
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = !isLoading && tokenOrCode.isNotBlank(),
                    shape = MaterialTheme.shapes.medium
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            stringResource(R.string.login_text),
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Checkbox
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Checkbox(
                        checked = loginWithToken,
                        onCheckedChange = { isChecked ->
                            loginWithToken = isChecked
                            tokenOrCode = if (isChecked) defaultToken else ""
                        },
                        enabled = !isLoading
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.login_with_token_label),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
            }
        }
    }
}