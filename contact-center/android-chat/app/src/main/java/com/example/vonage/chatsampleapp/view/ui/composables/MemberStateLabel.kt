package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.vonage.chatsampleapp.view.ui.theme.DarkGreen
import com.example.vonage.chatsampleapp.view.ui.theme.DarkRed
import com.example.vonage.chatsampleapp.view.ui.theme.DarkYellow
import com.vonage.clientcore.core.api.models.MemberState

@Preview(showBackground = true)
@Composable
fun MemberStateLabel(
    modifier: Modifier = Modifier,
    state: MemberState = MemberState.UNKNOWN
) {
    val color = when(state){
        MemberState.JOINED -> DarkGreen
        MemberState.INVITED -> DarkYellow
        MemberState.LEFT -> DarkRed
        MemberState.UNKNOWN -> Color.DarkGray
    }
    Text(
        text = state.name,
        style = MaterialTheme.typography.bodySmall,
        modifier = modifier
            .border(BorderStroke(1.dp, color), shape = CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        color = color
    )
}