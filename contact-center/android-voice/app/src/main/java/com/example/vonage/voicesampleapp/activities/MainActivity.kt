package com.example.vonage.voicesampleapp.activities

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.ui.theme.VoiceSampleAppTheme
import com.example.vonage.voicesampleapp.utils.*

class MainActivity : FragmentActivity() {
    companion object {
        private const val PERMISSIONS_REQUEST_CODE = 123
    }

    private val permissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.ANSWER_PHONE_CALLS,
        Manifest.permission.MANAGE_OWN_CALLS,
        Manifest.permission.READ_PHONE_NUMBERS,
        Manifest.permission.CALL_PHONE
    )

    private val arePermissionsGranted: Boolean
        get() {
            return permissions.all {
                ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
            }
        }

    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        checkPermissions()
        
        // Observe session ID and navigate to LoginActivity if logged out
        observeSessionId()
        
        // Observe active call and navigate to CallActivity when there's an incoming/outgoing call
        observeActiveCall()
        
        setContent {
            val currentUser by clientManager.currentUser.collectAsState()
            
            VoiceSampleAppTheme {
                MainScreen(
                    username = currentUser?.displayName 
                        ?: currentUser?.name 
                        ?: stringResource(R.string.logged_username_default),
                    onLogout = ::logout,
                    onCallUser = ::callUser
                )
            }
        }
    }
    
    private fun observeActiveCall() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.RESUMED) {
                coreContext.activeCall.collect { call ->
                    if (call != null) {
                        navigateToCallActivity()
                    }
                }
            }
        }
    }

    private fun observeSessionId() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                clientManager.sessionId.collect { sessionId ->
                    if (sessionId == null) {
                        navigateToLoginActivity()
                    }
                }
            }
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (arePermissionsGranted) {
            coreContext.telecomHelper
        }
    }

    private fun checkPermissions() {
        if (!arePermissionsGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSIONS_REQUEST_CODE)
        } else {
            coreContext.telecomHelper
        }
    }

    private fun logout() {
        // Navigation handled by observeSessionId() observer
        clientManager.logout()
    }

    private fun callUser(input: String) {
        val trimmedInput = input.trim()
        
        val callContext = trimmedInput.takeIf { it.isNotEmpty() }?.let {
            // Determine if input is a phone number (contains only digits, +, -, spaces, parentheses)
            val isPhoneNumber = it.matches(Regex("^[+\\d\\s\\-()]+$"))
            
            mapOf(
                Constants.CONTEXT_KEY_CALLEE to it,
                Constants.CONTEXT_KEY_CALL_TYPE to if (isPhoneNumber) Constants.PHONE_TYPE else Constants.APP_TYPE
            )
        }
        
        clientManager.startOutboundCall(callContext)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    username: String,
    onLogout: () -> Unit,
    onCallUser: (String) -> Unit
) {
    var callInput by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(
                            text = stringResource(R.string.app_name),
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = username,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSecondary.copy(alpha = 0.8f)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    TextButton(
                        onClick = onLogout,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) {
                        Text(stringResource(R.string.logout_label))
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .align(Alignment.Center)
                    .padding(horizontal = 32.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = stringResource(R.string.make_call_title),
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = stringResource(R.string.make_call_description),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(32.dp))

                OutlinedTextField(
                    value = callInput,
                    onValueChange = { callInput = it },
                    label = { Text(stringResource(R.string.edit_username_hint)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = { onCallUser(callInput) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text(
                        stringResource(R.string.button_call_user_label),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}