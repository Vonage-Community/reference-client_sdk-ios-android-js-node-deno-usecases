package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.material.AlertDialog
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.example.vonage.chatsampleapp.view.ui.theme.DarkRed

@Preview(showBackground = true)
@Composable
fun ConfirmationDialog(
    actionName: String = "Delete",
    itemType: String = "Item",
    onConfirm: () -> Unit = {},
    onDismiss: () -> Unit = {}
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = "$actionName $itemType") },
        text = { Text(text = "Are you sure you want to ${actionName.lowercase()} this ${itemType.lowercase()}?") },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(backgroundColor = DarkRed)
            ) {
                Text(text = "Confirm", color = Color.White)
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text(text = "Cancel")
            }
        }
    )
}
