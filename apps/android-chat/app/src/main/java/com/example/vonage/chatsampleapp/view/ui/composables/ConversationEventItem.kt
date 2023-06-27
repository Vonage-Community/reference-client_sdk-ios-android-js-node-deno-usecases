package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.vonage.chatsampleapp.data.models.MessengerActionable
import com.example.vonage.chatsampleapp.data.models.WhatsappActionable
import com.example.vonage.chatsampleapp.utils.convertUTCToLocalTime
import com.example.vonage.chatsampleapp.utils.displayName
import com.vonage.clientcore.core.api.models.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

@Composable
fun ConversationEventItem(
    event: ConversationEvent,
    username: Username
){
    val time = convertUTCToLocalTime(event.timestamp)
    when(event){
        is MemberInvitedConversationEvent -> {
            MemberEventItem(
                message = event.body.invitee.displayName() +
                        " has been invited by " +
                        (event.body.inviter?.displayName() ?: "unknown") + ".",
                time = time
            )
        }
        is MemberJoinedConversationEvent -> {
            MemberEventItem(
                message = event.body.user.displayName() +
                        " has joined the conversation.",
                time = time
            )
        }
        is MemberLeftConversationEvent -> {
            MemberEventItem(
                message = event.body.user.displayName() +
                        " has left the conversation.",
                time = time
            )
        }
        is TextMessageEvent -> {
            MessageItem(
                message = event.body.text,
                sender = event.body.sender.takeUnless { it.name == username }?.displayName(),
                senderImageUrl = event.body.sender.imageUrl?.takeUnless { it.isEmpty() },
                time = time
            )
        }
        is CustomMessageEvent -> {
            val sender = event.body.sender.takeUnless { it.name == username }?.displayName()
            val senderImageUrl = event.body.sender.imageUrl?.takeUnless { it.isEmpty() }
            var message: String = event.body.customData
            var actionButtonTitles = emptyList<String>()
            try { Json.decodeFromString<MessengerActionable>(event.body.customData) } catch (_: Exception){ null }?.
            apply {
                message = attachment.payload.text
                actionButtonTitles = attachment.payload.buttons.map { it.title }
            }
            try { Json.decodeFromString<WhatsappActionable>(event.body.customData) } catch (_: Exception){ null } ?.
            apply {
                message = "${interactive.header.text}\n${interactive.body.text}\n${interactive.footer.text}"
                actionButtonTitles = interactive.action.buttons.map { it.reply.title }
            }
            MessageItem(
                message = message,
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time,
                actionButtonTitles = actionButtonTitles
            )
        }
        is UnknownConversationEvent -> {}
    }
    Spacer(modifier = Modifier.height(8.dp))
}