package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.vonage.chatsampleapp.R
import com.vonage.clientcore.core.api.models.MemberState

@Preview(showBackground = true)
@Composable
fun ConversationItem(
    conversationName: String = "Test Conversation",
    conversationId: String = "CONV-123",
    conversationImageUrl : String? = null,
    memberState: MemberState = MemberState.JOINED,
    onClick: () -> Unit = {},
    onDelete: () -> Unit = {}
) {
    // State to control the visibility of the delete confirmation dialog
    var showDialog by remember { mutableStateOf(false) }

    Card(
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier
            .padding(6.dp)
            .clickable(onClick = onClick)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp)
        ) {
            AsyncImage(
                model = conversationImageUrl,
                contentDescription = conversationName,
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape),
                error = painterResource(R.drawable.group_icon)
            )
            Column(modifier = Modifier.weight(1f).padding(start = 16.dp)) {
                Text(
                    text = conversationName,
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = conversationId,
                    style = MaterialTheme.typography.labelSmall
                )
                MemberStateLabel(
                    modifier = Modifier.padding(top = 4.dp),
                    state = memberState
                )
            }
            IconButton(
                onClick = { showDialog = true },
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = stringResource(R.string.delete_conversation_hint)
                )
            }
        }
    }

    // Show delete confirmation dialog if showDialog is true
    if (showDialog) {
        ConfirmationDialog(
            actionName = "Delete",
            itemType = "Conversation",
            onConfirm = {
                // Handle delete confirmation
                onDelete()
                showDialog = false // Dismiss the dialog
            },
            onDismiss = { showDialog = false } // Dismiss the dialog without deleting
        )
    }
}