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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.DialogFragment
import com.example.vonage.voicesampleapp.App
import com.example.vonage.voicesampleapp.R
import com.example.vonage.voicesampleapp.ui.theme.VoiceSampleAppTheme

class DialerFragment : DialogFragment() {
    private val clientManager = App.coreContext.clientManager
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_DTMF, DTMF_VOLUME)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setContent {
                VoiceSampleAppTheme {
                    DialerDialog(
                        onSendDtmf = ::sendDtmf
                    )
                }
            }
        }
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

    override fun onDestroy() {
        super.onDestroy()
        toneGenerator.release()
    }

    companion object {
        private const val DTMF_VOLUME = 100
        private const val DTMF_DURATION = 100

        @JvmStatic
        fun newInstance() = DialerFragment()
    }
}

@Composable
fun DialerDialog(
    onSendDtmf: (String) -> Unit
) {
    var dialedDigits by remember { mutableStateOf("") }
    var lastDialedLength by remember { mutableIntStateOf(0) }

    // Detect when a new digit is added and send DTMF
    LaunchedEffect(dialedDigits) {
        if (dialedDigits.length > lastDialedLength) {
            val newDigit = dialedDigits.last().toString()
            onSendDtmf(newDigit)
        }
        lastDialedLength = dialedDigits.length
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
                text = stringResource(R.string.send_dtmf_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Description
            Text(
                text = stringResource(R.string.send_dtmf_description),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Input Field with Phone Keyboard
            OutlinedTextField(
                value = dialedDigits,
                onValueChange = { dialedDigits = it },
                modifier = Modifier.fillMaxWidth(),
                textStyle = MaterialTheme.typography.headlineMedium.copy(
                    textAlign = TextAlign.Center,
                    letterSpacing = 2.sp
                ),
                placeholder = {
                    Text(
                        text = stringResource(R.string.dtmf_placeholder),
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone
                ),
                shape = MaterialTheme.shapes.large,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    }
}
