package com.example.vonage.voicesampleapp.activities

import android.content.Intent
import android.os.Bundle
import android.telecom.Connection
import android.telecom.DisconnectCause
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.ui.theme.*
import com.example.vonage.voicesampleapp.utils.Constants
import com.example.vonage.voicesampleapp.utils.showDialerFragment

class CallActivity : FragmentActivity() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager
    
    private var isMuteToggled by mutableStateOf(false)
    private var isHoldToggled by mutableStateOf(false)
    private var isNoiseSuppressionToggled by mutableStateOf(false)
    private var callState by mutableStateOf<Int?>(null)
    private var fallbackUsername by mutableStateOf<String?>(null)
    private var disconnectCause by mutableStateOf<DisconnectCause?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleIntent(intent)
        
        // Observe call state changes
        observeCallState()
        
        setContent {
            val activeCall by coreContext.activeCall.collectAsState()
            
            VoiceSampleAppTheme {
                CallScreen(
                    username = activeCall?.callerDisplayName ?: fallbackUsername,
                    callState = callState,
                    isMuted = isMuteToggled,
                    isOnHold = isHoldToggled,
                    isNoiseSuppression = isNoiseSuppressionToggled,
                    disconnectCause = disconnectCause,
                    onAnswer = ::onAnswer,
                    onReject = ::onReject,
                    onHangup = ::onHangup,
                    onMute = ::onMute,
                    onHold = ::onHold,
                    onNoiseSuppression = ::onNoiseSuppression,
                    onKeypad = ::onKeypad
                )
            }
        }
    }
    
    private fun observeCallState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                coreContext.activeCall.collect { call ->
                    if (call == null) {
                        // Give UI a moment to show disconnect reason before finishing
                        kotlinx.coroutines.delay(1000)
                        finish()
                        return@collect
                    }
                    
                    // Capture username before it might become null
                    fallbackUsername = call.callerDisplayName
                    
                    // Initialize states
                    callState = call.state
                    isMuteToggled = call.isMuted.value
                    isHoldToggled = call.isOnHold.value
                    
                    // Observe connection state
                    launch {
                        call.connectionState.collect { state ->
                            callState = state
                            if (state == Connection.STATE_DISCONNECTED) {
                                disconnectCause = call.disconnectCause
                            }
                        }
                    }
                    
                    // Observe mute state from CallConnection (single source of truth)
                    launch {
                        call.isMuted.collect { muted ->
                            isMuteToggled = muted
                        }
                    }
                    
                    // Observe hold state
                    launch {
                        call.isOnHold.collect { onHold ->
                            isHoldToggled = onHold
                        }
                    }
                }
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        intent ?: return
        val from = intent.getStringExtra(Constants.EXTRA_KEY_FROM) ?: return
        fallbackUsername = from
        callState = Connection.STATE_RINGING
    }

    private fun onAnswer() {
        coreContext.activeCall.value?.let { call ->
            clientManager.answerCall(call)
        }
    }

    private fun onReject() {
        coreContext.activeCall.value?.let { call ->
            clientManager.rejectCall(call)
        }
    }

    private fun onHangup() {
        coreContext.activeCall.value?.let { call ->
            clientManager.hangupCall(call)
        }
    }

    private fun onMute() {
        coreContext.activeCall.value?.toggleMuteState()
    }

    private fun onHold() {
        coreContext.activeCall.value?.toggleHoldState()
    }

    private fun onNoiseSuppression() {
        coreContext.activeCall.value?.let { call ->
            isNoiseSuppressionToggled = !isNoiseSuppressionToggled
            if (isNoiseSuppressionToggled) {
                clientManager.enableNoiseSuppression(call)
            } else {
                clientManager.disableNoiseSuppression(call)
            }
        }
    }

    private fun onKeypad() {
        showDialerFragment()
    }
}

@Composable
fun CallScreen(
    username: String?,
    callState: Int?,
    isMuted: Boolean,
    isOnHold: Boolean,
    isNoiseSuppression: Boolean,
    disconnectCause: DisconnectCause?,
    onAnswer: () -> Unit,
    onReject: () -> Unit,
    onHangup: () -> Unit,
    onMute: () -> Unit,
    onHold: () -> Unit,
    onNoiseSuppression: () -> Unit,
    onKeypad: () -> Unit
) {
    val isRinging = callState == Connection.STATE_RINGING
    
    val (gradientColors, stateLabel, stateColor) = when (callState) {
        Connection.STATE_RINGING -> Triple(
            listOf(Purple500, Teal200),
            R.string.call_state_ringing_label,
            Color.White
        )
        Connection.STATE_DIALING -> Triple(
            listOf(Purple500, Teal200),
            R.string.call_state_dialing_label,
            Color.White
        )
        Connection.STATE_ACTIVE -> Triple(
            listOf(Green.copy(alpha = 0.8f), Teal700.copy(alpha = 0.8f)),
            if (isOnHold) R.string.call_state_holding_label else R.string.call_state_active_label,
            Color.White
        )
        Connection.STATE_HOLDING -> Triple(
            listOf(Gray, Gray.copy(alpha = 0.7f)),
            R.string.call_state_holding_label,
            Color.White
        )
        Connection.STATE_DISCONNECTED -> {
            val label = when(disconnectCause?.code) {
                DisconnectCause.LOCAL -> R.string.call_state_locally_disconnected_label
                DisconnectCause.REJECTED -> R.string.call_state_rejected_label
                else -> R.string.call_state_remotely_disconnected_label
            }
            Triple(
                listOf(Red.copy(alpha = 0.7f), Red.copy(alpha = 0.5f)),
                label,
                Color.White
            )
        }
        else -> Triple(
            listOf(Purple500.copy(alpha = 0.7f), Purple700.copy(alpha = 0.5f)),
            R.string.call_state_reconnecting_label,
            Color.White
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = gradientColors
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Spacer(modifier = Modifier.height(40.dp))

                // User Avatar
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(White.copy(alpha = 0.25f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = stringResource(R.string.user_avatar_description),
                        modifier = Modifier.size(56.dp),
                        tint = White
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Username
                Text(
                    text = username ?: "Unknown",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 26.sp
                    ),
                    color = White
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Call State Badge
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = White.copy(alpha = 0.2f),
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Text(
                        text = stringResource(stateLabel),
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.Medium
                        ),
                        color = stateColor,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))

            // Action Buttons
            if (isRinging) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(48.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 24.dp)
                ) {
                    CallActionButton(
                        icon = Icons.Default.CallEnd,
                        contentDescription = stringResource(R.string.reject_button_description),
                        backgroundColor = Red,
                        onClick = onReject,
                        size = 68.dp
                    )
                    CallActionButton(
                        icon = Icons.Default.Call,
                        contentDescription = stringResource(R.string.answer_button_description),
                        backgroundColor = Green,
                        onClick = onAnswer,
                        size = 68.dp
                    )
                }
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.padding(bottom = 24.dp)
                ) {
                    // First row - main controls
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CallActionButton(
                            icon = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = stringResource(R.string.mute_button_description),
                            backgroundColor = if (isMuted) White else White.copy(alpha = 0.3f),
                            iconTint = if (isMuted) Red else White,
                            onClick = onMute
                        )
                        CallActionButton(
                            icon = if (isOnHold) Icons.Default.PlayArrow else Icons.Default.Pause,
                            contentDescription = stringResource(R.string.hold_button_description),
                            backgroundColor = if (isOnHold) White else White.copy(alpha = 0.3f),
                            iconTint = if (isOnHold) Color(0xFF2196F3) else White,
                            onClick = onHold
                        )
                        CallActionButton(
                            icon = Icons.Default.Dialpad,
                            contentDescription = stringResource(R.string.keypad_button_description),
                            backgroundColor = White.copy(alpha = 0.3f),
                            onClick = onKeypad
                        )
                    }
                    
                    // Second row - secondary controls
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CallActionButton(
                            icon = Icons.Default.GraphicEq,
                            contentDescription = stringResource(R.string.noise_suppression_button_description),
                            backgroundColor = if (isNoiseSuppression) White else White.copy(alpha = 0.3f),
                            iconTint = if (isNoiseSuppression) Purple500 else White,
                            onClick = onNoiseSuppression
                        )
                        // Hangup button - prominent
                        CallActionButton(
                            icon = Icons.Default.CallEnd,
                            contentDescription = stringResource(R.string.hangup_button_description),
                            backgroundColor = Red,
                            onClick = onHangup,
                            size = 64.dp
                        )
                        // Spacer for balance
                        Spacer(modifier = Modifier.size(64.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun CallActionButton(
    icon: ImageVector,
    contentDescription: String,
    backgroundColor: Color,
    iconTint: Color = White,
    onClick: () -> Unit,
    size: androidx.compose.ui.unit.Dp = 64.dp
) {
    FloatingActionButton(
        onClick = onClick,
        containerColor = backgroundColor,
        modifier = Modifier.size(size)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = iconTint,
            modifier = Modifier.size(size * 0.5f)
        )
    }
}