package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Preview(showBackground = true)
@Composable
fun ConversationDateLabel(date:String = "Monday, 01 January 1970"){
    Text(
        modifier = Modifier
            .fillMaxWidth()
            .padding(10.dp),
        text = date,
        textAlign = TextAlign.Center
    )
}