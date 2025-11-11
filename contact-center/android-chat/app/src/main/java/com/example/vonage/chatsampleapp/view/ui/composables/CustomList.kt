package com.example.vonage.chatsampleapp.view.ui.composables

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.paging.LoadState
import androidx.paging.PagingData
import androidx.paging.compose.LazyPagingItems
import androidx.paging.compose.collectAsLazyPagingItems
import kotlinx.coroutines.flow.*

@OptIn(ExperimentalMaterial3Api::class) // required by PullToRefresh
@Preview(showBackground = true)
@Composable
fun <T:Any> CustomList(
    modifier: Modifier = Modifier,
    reverseLayout : Boolean = false,
    verticalArrangement: Arrangement.Vertical = if (!reverseLayout) Arrangement.Top else Arrangement.Bottom,
    horizontalAlignment: Alignment.Horizontal = Alignment.Start,
    lazilyPagedList: LazyPagingItems<T> = flowOf(PagingData.empty<T>()).collectAsLazyPagingItems(),
    localList : List<T> = listOf(),
    emptyListMessage : String = "No Items Found",
    isRefreshEnabled : Boolean = true,
    isRefreshing : Boolean = false,
    onRefresh: () -> Unit = {},
    groupByKey: (T) -> String = { "" },
    labelFactory: @Composable (String) -> Unit = {},
    itemFactory: @Composable (T) -> Unit = {}
){
    val fullList = if(reverseLayout) {
        localList + lazilyPagedList.itemSnapshotList.items
    } else {
        lazilyPagedList.itemSnapshotList.items + localList
    }
    LaunchedEffect(lazilyPagedList.itemCount){
        if(lazilyPagedList.itemCount == 0) return@LaunchedEffect
        // Calling get will force the itemSnapshotList to be refreshed
        lazilyPagedList[lazilyPagedList.itemCount-1]
    }
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = modifier
    ){
        LazyColumn(
            modifier = Modifier,
            reverseLayout = reverseLayout,
            verticalArrangement = verticalArrangement,
            horizontalAlignment = horizontalAlignment
        ) {
            val groupedItems = fullList.groupBy(groupByKey).toList()
            itemsIndexed(groupedItems){_, (key, items) ->
                if(!reverseLayout){
                    labelFactory(key)
                }
                items.forEach { item ->
                    itemFactory(item)
                }
                if(reverseLayout){
                    labelFactory(key)
                }
            }
            handleLoadState(lazilyPagedList.loadState.append)
            handleLoadState(lazilyPagedList.loadState.refresh)
            if (lazilyPagedList.itemCount == 0 &&
                lazilyPagedList.loadState.refresh is LoadState.NotLoading) {
                item {
                    NoItemsFound(emptyListMessage)
                }
            }
        }
    }
}

private fun LazyListScope.handleLoadState(state: LoadState){
    when (state) {
        is LoadState.Error -> {
            item {
                ErrorItem(state.error.message ?: "Some error occurred")
            }
        }
        is LoadState.Loading -> {
            item {
                LoadingItem()
            }
        }
        is LoadState.NotLoading -> Unit
    }
}