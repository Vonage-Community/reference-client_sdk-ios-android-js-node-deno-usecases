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
        is MessageTextEvent -> {
            MessageItem(
                message = event.body.text,
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        }
        is MessageCustomEvent -> {
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
        is MessageAudioEvent ->
            MessageItem(
                message = "Audio: ${event.body.audioUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageFileEvent ->
            MessageItem(
                message = "FileMes: ${event.body.fileUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageImageEvent ->
            MessageItem(
                message = "Image: ${event.body.imageUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageLocationEvent ->
            MessageItem(
                message = "Location: ${event.body.location}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageTemplateEvent ->
            MessageItem(
                message = "Template: ${event.body.template}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageVCardEvent ->
            MessageItem(
                message = "VCard: ${event.body.vcardUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is MessageVideoEvent ->
            MessageItem(
                message = "Video: ${event.body.videoUrl}",
                sender = sender,
                senderImageUrl = senderImageUrl,
                time = time
            )
        is CustomConversationEvent,
        is EphemeralConversationEvent,
        is EventDeleteConversationEvent,
        is MessageDeliveredEvent,
        is MessageRejectedEvent,
        is MessageSeenEvent,
        is MessageSubmittedEvent,
        is MessageUndeliverableEvent -> {
        //NOOP
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}