package com.example.vonage.chatsampleapp.utils

import android.annotation.SuppressLint
import android.widget.Toast
import androidx.activity.ComponentActivity
import com.vonage.clientcore.core.api.models.Conversation
import com.vonage.clientcore.core.api.models.User
import java.text.SimpleDateFormat
import java.util.*

internal fun ComponentActivity.showToast(msg: String){
    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}

@SuppressLint("ConstantLocale")
private val utcFormat = SimpleDateFormat(Constants.UTC_TIME_FORMAT, Locale.getDefault()).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}

@SuppressLint("ConstantLocale")
private val dateFormat = SimpleDateFormat(Constants.OUTPUT_DATE_FORMAT, Locale.getDefault()).apply {
    timeZone = TimeZone.getDefault()
}

@SuppressLint("ConstantLocale")
private val localTimeFormat = SimpleDateFormat(Constants.LOCAL_TIME_FORMAT, Locale.getDefault()).apply {
    timeZone = TimeZone.getDefault()
}

private val todayDate = dateFormat.format(Calendar.getInstance().time)

private val yesterdayDate = dateFormat.format(Calendar.getInstance().apply {
    add(Calendar.DAY_OF_YEAR, -1)
}.time)

internal fun convertUTCToLocalTime(utcDate: String): String {
    val date = utcFormat.parse(utcDate)
    return localTimeFormat.format(date!!)
}

internal fun convertUTCToDate(utcDate: String) : String {
    val date = utcFormat.parse(utcDate)
    return when(val formatted = dateFormat.format(date!!)){
        todayDate -> "Today"
        yesterdayDate -> "Yesterday"
        else -> formatted
    }
}

internal fun convertUTCToDateAndTime(utcDate: String) : String {
    val date = convertUTCToDate(utcDate)
    val time = convertUTCToLocalTime(utcDate)
    return "$date at $time"
}

internal fun convertUTCToTimestamp(utcDate: String) : Long {
    return utcFormat.parse(utcDate)?.time ?: System.currentTimeMillis()
}

internal fun User.displayName() : String =
    displayName?.takeUnless { it.isBlank() } ?: name

internal fun Conversation.displayName() : String =
    displayName?.takeUnless { it.isBlank() } ?: name