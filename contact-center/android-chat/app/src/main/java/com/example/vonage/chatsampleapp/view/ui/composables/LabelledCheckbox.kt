package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Preview(showBackground = true)
@Composable
fun LabelledCheckbox(
    modifier: Modifier = Modifier,
    label: String = "Labelled Check Box",
    isChecked: Boolean = true,
    onCheckedChange: (Boolean) -> Unit = {}
) {
    Row(modifier = modifier,
        verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            enabled = true
        )
        Text(text = label)
    }
}