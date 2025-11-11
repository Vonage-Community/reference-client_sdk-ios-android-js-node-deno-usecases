package com.example.vonage.voicesampleapp.activities.fragments

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.DialogFragment
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.ui.theme.Gray
import com.example.vonage.voicesampleapp.ui.theme.Green
import com.example.vonage.voicesampleapp.ui.theme.Red
import com.example.vonage.voicesampleapp.ui.theme.VoiceSampleAppTheme
import com.example.vonage.voicesampleapp.utils.Constants
import com.example.vonage.voicesampleapp.utils.DialerType

private const val ARG_TYPE = "dialer_type"

class DialerFragment : DialogFragment() {
    private val clientManager = App.coreContext.clientManager
    private var type: DialerType = DialerType.PHONE_NUMBER
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_DTMF, DTMF_VOLUME)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            type = DialerType.valueOf(it.getString(ARG_TYPE)!!)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setContent {
                VoiceSampleAppTheme {
                    DialerDialog(
                        dialerType = type,
                        onDismiss = { dismiss() },
                        onMakeCall = ::makeCall,
                        onSendDtmf = ::sendDtmf
                    )
                }
            }
        }
    }

    private fun makeCall(number: String) {
        val callContext = number.takeUnless { it.isEmpty() }?.let {
            mapOf(
                Constants.CONTEXT_KEY_CALLEE to it,
                Constants.CONTEXT_KEY_CALL_TYPE to Constants.PHONE_TYPE
            )
        }
        clientManager.startOutboundCall(callContext)
    }

    private fun sendDtmf(digit: String) {
        val toneType = when (digit) {
            "0" -> ToneGenerator.TONE_DTMF_0
            "1" -> ToneGenerator.TONE_DTMF_1
            "2" -> ToneGenerator.TONE_DTMF_2
            "3" -> ToneGenerator.TONE_DTMF_3
            "4" -> ToneGenerator.TONE_DTMF_4
            "5" -> ToneGenerator.TONE_DTMF_5
            "6" -> ToneGenerator.TONE_DTMF_6
            "7" -> ToneGenerator.TONE_DTMF_7
            "8" -> ToneGenerator.TONE_DTMF_8
            "9" -> ToneGenerator.TONE_DTMF_9
            "#" -> ToneGenerator.TONE_DTMF_P
            "*" -> ToneGenerator.TONE_DTMF_S
            else -> null
        } ?: return
        toneGenerator.startTone(toneType, DTMF_DURATION)
        App.coreContext.activeCall.value?.let {
            clientManager.sendDtmf(it, digit)
        }
    }

    companion object {
        private const val DTMF_VOLUME = 100
        private const val DTMF_DURATION = 100

        @JvmStatic
        fun newInstance(type: DialerType) =
            DialerFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_TYPE, type.name)
                }
            }
    }
}

@Composable
fun DialerDialog(
    dialerType: DialerType,
    onDismiss: () -> Unit,
    onMakeCall: (String) -> Unit,
    onSendDtmf: (String) -> Unit
) {
    var dialedNumber by remember { mutableStateOf("") }
    var lastDialedLength by remember { mutableStateOf(0) }

    // Detect when a new digit is added for DTMF
    LaunchedEffect(dialedNumber) {
        if (dialerType == DialerType.DTMF && dialedNumber.length > lastDialedLength) {
            val newDigit = dialedNumber.last().toString()
            onSendDtmf(newDigit)
        }
        lastDialedLength = dialedNumber.length
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 3.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Drag handle
            Box(
                modifier = Modifier
                    .width(32.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f))
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Title
            Text(
                text = if (dialerType == DialerType.PHONE_NUMBER) "Dial Number" else "Send DTMF",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Compact phone number input field
            OutlinedTextField(
                value = dialedNumber,
                onValueChange = { dialedNumber = it },
                modifier = Modifier.fillMaxWidth(),
                textStyle = MaterialTheme.typography.headlineMedium.copy(
                    textAlign = TextAlign.Center,
                    letterSpacing = 2.sp
                ),
                placeholder = {
                    Text(
                        text = if (dialerType == DialerType.PHONE_NUMBER) "Enter number" else "Digits",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone,
                    imeAction = if (dialerType == DialerType.PHONE_NUMBER) ImeAction.Done else ImeAction.Default
                ),
                keyboardActions = KeyboardActions(
                    onDone = {
                        if (dialerType == DialerType.PHONE_NUMBER) {
                            onMakeCall(dialedNumber)
                            onDismiss()
                        }
                    }
                ),
                shape = MaterialTheme.shapes.large,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Call button (only for PHONE_NUMBER type)
            if (dialerType == DialerType.PHONE_NUMBER) {
                Button(
                    onClick = { 
                        onMakeCall(dialedNumber)
                        onDismiss()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    ),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Icon(
                        imageVector = Icons.Default.Call,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.dialer_btn_call),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
            } else {
                // For DTMF, just show a dismiss button
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Done")
                }
                
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}
