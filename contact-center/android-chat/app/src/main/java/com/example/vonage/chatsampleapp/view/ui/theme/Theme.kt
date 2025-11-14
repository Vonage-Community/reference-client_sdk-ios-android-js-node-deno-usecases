package com.example.vonage.chatsampleapp.view.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color.White,
    primaryContainer = Color.DarkGray,
    onPrimary = Color.Black,
    secondary = Purple500,
    secondaryContainer = Purple700,
    onSecondary = Color.Black
)

private val LightColorScheme = lightColorScheme(
    primary = Color.Black,
    primaryContainer = Color.LightGray,
    onPrimary = Color.White,
    secondary = Purple200,
    secondaryContainer = Purple700,
    onSecondary = Color.White
    /* Other default colors to override
    background = Color.White,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = Color.Black,
    onSurface = Color.Black,
    */
)

@Composable
fun ChatSampleAppTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val colorScheme = if (darkTheme) {
        DarkColorScheme
    } else {
        LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}