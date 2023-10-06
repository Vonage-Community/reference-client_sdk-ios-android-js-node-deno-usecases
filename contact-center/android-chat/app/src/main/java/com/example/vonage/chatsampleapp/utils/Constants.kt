package com.example.vonage.chatsampleapp.utils

import com.vonage.clientcore.core.api.models.PresentingOrder

internal object Constants {
    val CONVERSATION_NAME_REGEX = "^[a-zA-Z0-9_]{3,20}\$".toRegex()
    val CONVERSATION_ID_REGEX = "CON-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}".toRegex()
    const val PAGE_SIZE = 30
    val DEFAULT_ORDER = PresentingOrder.DESC
    const val UTC_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    const val OUTPUT_DATE_FORMAT = "EEEE, dd MMMM yyyy"
    const val LOCAL_TIME_FORMAT = "h.mm a"
}