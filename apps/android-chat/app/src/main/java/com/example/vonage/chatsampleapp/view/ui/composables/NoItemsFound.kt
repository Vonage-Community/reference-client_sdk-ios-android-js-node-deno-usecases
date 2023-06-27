package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Preview(showBackground = true)
@Composable
fun NoItemsFound(message: String = "No Items Found"){
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .padding(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            modifier = Modifier
                .fillMaxWidth()
        )
    }
}