package com.example.vonage.chatsampleapp.view.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.MaterialTheme
import androidx.compose.material.darkColors
import androidx.compose.material.lightColors
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorPalette = darkColors(
    primary = Color.White,
    primaryVariant = Color.DarkGray,
    onPrimary = Color.Black,
    secondary = Purple500,
    secondaryVariant = Purple700,
    onSecondary = Color.Black
)

private val LightColorPalette = lightColors(
    primary = Color.Black,
    primaryVariant = Color.LightGray,
    onPrimary = Color.White,
    secondary = Purple200,
    secondaryVariant = Purple700,
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
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }

    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}