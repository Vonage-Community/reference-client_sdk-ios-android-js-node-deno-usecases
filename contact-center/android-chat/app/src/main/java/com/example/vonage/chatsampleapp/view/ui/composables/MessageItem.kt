package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.vonage.chatsampleapp.R

private val sentMessageBubbleShape = RoundedCornerShape(8.dp, 0.dp, 8.dp, 8.dp)
private val receivedMessageBubbleShape = RoundedCornerShape(0.dp, 8.dp, 8.dp, 8.dp)

@Preview(showBackground = true)
@Composable
fun MessageItem(
    modifier: Modifier = Modifier,
    message: String = "Lorem ipsum dolor sit amet.",
    sender: String? = "Test User 1",
    senderImageUrl: String? = null,
    time: String = "12:34 PM",
    actionButtonTitles: List<String> = emptyList()
){
    val isSentByMe = sender == null
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (isSentByMe) Arrangement.End else Arrangement.Start
    ){
        if(!isSentByMe) {
            AsyncImage(
                model = senderImageUrl,
                contentDescription = sender,
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape),
                error = painterResource(R.drawable.user_icon),
            )
        }
        val messagePadding = if(isSentByMe) PaddingValues(0.dp) else PaddingValues(top = 12.dp, start = 10.dp)
        Column(
            modifier = modifier
                .fillMaxWidth()
                .padding(messagePadding),
            horizontalAlignment = if(isSentByMe) Alignment.End else Alignment.Start
        ) {
            Column(
                modifier = Modifier
                    .background(
                        color = if(isSentByMe) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primaryContainer,
                        shape = if(isSentByMe) sentMessageBubbleShape else receivedMessageBubbleShape
                    )
                    .padding(
                        top = 8.dp,
                        bottom = 8.dp,
                        start = 16.dp,
                        end = 16.dp
                    ),
                horizontalAlignment = if(isSentByMe) Alignment.End else Alignment.Start
            ) {
                sender?.let {
                    Text(
                        text = sender,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = message
                )
                actionButtonTitles.takeIf { it.isNotEmpty() }?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    it.forEach { title ->
                        Button(
                            onClick = { /* Handle button click */ },
                            enabled = false
                        ) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
            Text(
                text = time,
                fontSize = 12.sp,
                modifier = Modifier
                    .padding(start = 8.dp, end = 8.dp)
            )
        }
    }
}
