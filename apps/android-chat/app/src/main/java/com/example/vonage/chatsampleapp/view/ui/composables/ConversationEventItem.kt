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
    val from = event.from
    val sender = when(from) {
        is System -> "Admin"
        is EmbeddedInfo -> from.user.takeUnless { it.name == username }?.displayName()
    }
    val senderImageUrl = (from as? EmbeddedInfo)?.user?.imageUrl?.takeUnless { it.isEmpty() }
    when(event){
        is MemberInvitedConversationEvent -> {
            MemberEventItem(
                message = event.body.user.displayName() +
                        " has been invited by " +
                        (sender ?: "You") + ".",
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
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        }
        is CustomMessageEvent -> {
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

        // TODO(display files, or make the, clickable to view)
        is AudioMessageEvent ->
            MessageItem(
                message = "Audio: ${event.body.audioUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is FileMessageEvent ->
            MessageItem(
                message = "FileMes: ${event.body.fileUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is ImageMessageEvent ->
            MessageItem(
                message = "Image: ${event.body.imageUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is LocationMessageEvent ->
            MessageItem(
                message = "Location: ${event.body.location}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is TemplateMessageEvent ->
            MessageItem(
                message = "Template: ${event.body.template}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is VCardMessageEvent ->
            MessageItem(
                message = "VCard: ${event.body.vcardUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is VideoMessageEvent ->
            MessageItem(
                message = "Video: ${event.body.videoUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
    }
    Spacer(modifier = Modifier.height(8.dp))
}