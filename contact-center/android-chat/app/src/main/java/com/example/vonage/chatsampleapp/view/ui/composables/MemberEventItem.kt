package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Preview(showBackground = true)
@Composable
fun MemberEventItem(
    modifier: Modifier = Modifier,
    message: String = "Test User 1 has been invited to conversation by Test User 2",
    time: String = "12:34 PM",
){
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = message,
            fontStyle = FontStyle.Italic
        )
        Text(
            text = time,
            fontSize = 12.sp,
            modifier = Modifier
                .padding(start = 8.dp, end = 8.dp)
        )
    }
}