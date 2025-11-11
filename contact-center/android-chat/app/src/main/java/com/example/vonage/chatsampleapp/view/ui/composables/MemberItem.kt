package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.Card
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.vonage.chatsampleapp.R
import com.vonage.clientcore.core.api.models.ChannelType
import com.vonage.clientcore.core.api.models.MemberState

@OptIn(ExperimentalFoundationApi::class)
@Preview(showBackground = true)
@Composable
fun MemberItem(
    userImageUrl: String? = null,
    username: String = "testuser",
    displayName: String = "Test User",
    memberId: String = "MEM-321",
    memberChannel : ChannelType? = ChannelType.MESSENGER,
    memberState: MemberState = MemberState.INVITED,
    isYourMember: Boolean = true,
    onLongClick: () -> Unit = {}
) {
    Card(
        elevation = 4.dp,
        modifier = Modifier
            .padding(6.dp)
            .combinedClickable (
                onClick = {},
                onLongClick = onLongClick
            )
    ){
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .padding(vertical = 8.dp, horizontal = 8.dp)
                .fillMaxWidth()
        ) {
            AsyncImage(
                model = userImageUrl,
                contentDescription = displayName,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape),
                error = painterResource(R.drawable.user_icon),
            )
            Column(
                modifier = Modifier
                    .padding(start = 16.dp)
                    .weight(1f)
            ) {
                val nameLabel = displayName + (if(isYourMember) " (you)" else String())

                Text(
                    text = nameLabel,
                    style = MaterialTheme.typography.subtitle1
                )

                Text(
                    text = username,
                    style = MaterialTheme.typography.subtitle2
                )

                Text(
                    text = memberId,
                    style = MaterialTheme.typography.overline
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    MemberStateLabel(
                        modifier = Modifier.padding(top = 4.dp),
                        state = memberState
                    )
                    Text(
                        text = memberChannel?.let { "${it.name} CHANNEL" } ?: String(),
                        style = MaterialTheme.typography.caption
                    )
                }
            }
        }
    }
}