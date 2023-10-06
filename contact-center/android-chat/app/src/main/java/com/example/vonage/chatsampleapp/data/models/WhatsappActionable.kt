package com.example.vonage.chatsampleapp.data.models


import kotlinx.serialization.Serializable

@Serializable
data class WhatsappActionable(
    val interactive: Interactive,
    val type: String
) {
    @Serializable
    data class Interactive(
        val action: Action,
        val body: Body,
        val footer: Footer,
        val header: Header,
        val type: String
    ) {
        @Serializable
        data class Action(
            val buttons: List<Button>
        ) {
            @Serializable
            data class Button(
                val reply: Reply,
                val type: String
            ) {
                @Serializable
                data class Reply(
                    val id: String,
                    val title: String
                )
            }
        }

        @Serializable
        data class Body(
            val text: String
        )

        @Serializable
        data class Footer(
            val text: String
        )

        @Serializable
        data class Header(
            val text: String,
            val type: String
        )
    }
}