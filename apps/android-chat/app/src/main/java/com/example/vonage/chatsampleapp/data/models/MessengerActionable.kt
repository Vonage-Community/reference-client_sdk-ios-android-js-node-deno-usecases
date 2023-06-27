package com.example.vonage.chatsampleapp.data.models

import kotlinx.serialization.Serializable

@Serializable
data class MessengerActionable(
    val attachment: Attachment
){
    @Serializable
    data class Attachment(
        val payload: Payload,
        val type: String
    )

    @Serializable
    data class Payload(
        val buttons: List<Button>,
        @Suppress("PropertyName")
        val template_type: String,
        val text: String
    )

    @Serializable
    data class Button(
        val payload: String? = null,
        val url: String? = null,
        val title: String,
        val type: String
    )
}