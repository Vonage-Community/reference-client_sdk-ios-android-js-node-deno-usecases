package com.example.vonage.voicesampleapp.activities

import android.content.Intent
import android.os.Bundle
import android.telecom.DisconnectCause
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import androidx.core.telecom.CallEndpointCompat
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.core.ActiveCall
import com.example.vonage.voicesampleapp.core.CallState
import com.example.vonage.voicesampleapp.telecom.CallNotifier
import com.example.vonage.voicesampleapp.ui.theme.*
import com.example.vonage.voicesampleapp.utils.showDialerFragment

class CallActivity : FragmentActivity() {
    private val coreContext = App.coreContext
    private val clientManager = coreContext.clientManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleIntent(intent)

        setContent {
            val call = coreContext.activeCall.collectAsState().value ?:
            // If active call is null, finish the activity
            run {
                LaunchedEffect(Unit) { finish() }
                return@setContent
            }

            val username = call.displayName.ifBlank { stringResource(R.string.caller_display_name_default) }

            VoiceSampleAppTheme {
                CallScreen(
                    username = username,
                    callState = call.state,
                    isMuted = call.isMuted,
                    isOnHold = call.isOnHold,
                    isNoiseSuppression = call.isNoiseSuppressionEnabled,
                    disconnectCause = call.disconnectCause,
                    currentAudioEndpoint = call.currentAudioEndpoint,
                    audioEndpoints = call.availableAudioEndpoints,
                    onAnswer = { clientManager.answerCall() },
                    onReject = { clientManager.rejectCall() },
                    onHangup = { clientManager.hangupCall() },
                    onMute = { if (!call.isMuted) clientManager.mute() else clientManager.unmute() },
                    onHold = { if (!call.isOnHold) clientManager.holdCall() else clientManager.unholdCall() },
                    onNoiseSuppression = { if (!call.isNoiseSuppressionEnabled) clientManager.enableNoiseSuppression() else clientManager.disableNoiseSuppression() },
                    onKeypad = { showDialerFragment() },
                    onSelectAudioEndpoint = { clientManager.setAudioEndpoint(it) }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    /** The notification's Answer action launches this activity directly (no trampoline). */
    private fun handleIntent(intent: Intent?) {
        if (intent?.action == CallNotifier.ACTION_ANSWER) {
            clientManager.answerCall()
        }
    }
}

@Composable
fun CallScreen(
    username: String?,
    callState: CallState,
    isMuted: Boolean,
    isOnHold: Boolean,
    isNoiseSuppression: Boolean,
    disconnectCause: Int?,
    currentAudioEndpoint: CallEndpointCompat?,
    audioEndpoints: List<CallEndpointCompat>,
    onAnswer: () -> Unit,
    onReject: () -> Unit,
    onHangup: () -> Unit,
    onMute: () -> Unit,
    onHold: () -> Unit,
    onNoiseSuppression: () -> Unit,
    onKeypad: () -> Unit,
    onSelectAudioEndpoint: (CallEndpointCompat) -> Unit
) {
    val isRinging = callState == CallState.RINGING

    val (gradientColors, stateLabel, stateColor) = when (callState) {
        CallState.RINGING -> Triple(
            listOf(Purple500, Teal200),
            R.string.call_state_ringing_label,
            Color.White
        )
        CallState.DIALING -> Triple(
            listOf(Purple500, Teal200),
            R.string.call_state_dialing_label,
            Color.White
        )
        CallState.ACTIVE -> if (isOnHold) Triple(
            listOf(Gray, Gray.copy(alpha = 0.7f)),
            R.string.call_state_holding_label,
            Color.White
        ) else Triple(
            listOf(Green.copy(alpha = 0.8f), Teal700.copy(alpha = 0.8f)),
            R.string.call_state_active_label,
            Color.White
        )
        CallState.DISCONNECTED -> {
            val label = when(disconnectCause) {
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
        CallState.RECONNECTING -> Triple(
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
                        // When on hold, the mic button is neutral
                        CallActionButton(
                            icon = if(isOnHold) Icons.Default.Mic else if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = stringResource(R.string.mute_button_description),
                            backgroundColor = if(isOnHold) White.copy(alpha = 0.3f) else if (isMuted) White else White.copy(alpha = 0.3f),
                            iconTint = if(isOnHold) White else if (isMuted) Red else White,
                            onClick = if(isOnHold) {{}} else onMute
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
                        // Audio output route picker (speaker / Bluetooth / wired)
                        AudioRouteButton(
                            current = currentAudioEndpoint,
                            endpoints = audioEndpoints,
                            onSelect = onSelectAudioEndpoint
                        )
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

/**
 * Call-audio output picker. Shows the current route's icon; tapping opens a menu
 * of the endpoints Core-Telecom reports (earpiece / speaker / Bluetooth / wired).
 */
@Composable
fun AudioRouteButton(
    current: CallEndpointCompat?,
    endpoints: List<CallEndpointCompat>,
    onSelect: (CallEndpointCompat) -> Unit,
    size: androidx.compose.ui.unit.Dp = 64.dp
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        CallActionButton(
            icon = audioRouteIcon(current?.type),
            contentDescription = stringResource(R.string.audio_route_button_description),
            backgroundColor = White.copy(alpha = 0.3f),
            onClick = { if (endpoints.isNotEmpty()) expanded = true },
            size = size
        )
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            endpoints.forEach { endpoint ->
                DropdownMenuItem(
                    text = { Text(endpoint.name.toString()) },
                    leadingIcon = { Icon(audioRouteIcon(endpoint.type), contentDescription = null) },
                    trailingIcon = if (endpoint.identifier == current?.identifier) {
                        { Icon(Icons.Default.Check, contentDescription = null) }
                    } else null,
                    onClick = {
                        expanded = false
                        onSelect(endpoint)
                    }
                )
            }
        }
    }
}

private fun audioRouteIcon(type: Int?): ImageVector = when (type) {
    CallEndpointCompat.TYPE_SPEAKER -> Icons.AutoMirrored.Filled.VolumeUp
    CallEndpointCompat.TYPE_BLUETOOTH -> Icons.Default.Bluetooth
    CallEndpointCompat.TYPE_WIRED_HEADSET -> Icons.Default.Headset
    else -> Icons.Default.PhoneInTalk
}
