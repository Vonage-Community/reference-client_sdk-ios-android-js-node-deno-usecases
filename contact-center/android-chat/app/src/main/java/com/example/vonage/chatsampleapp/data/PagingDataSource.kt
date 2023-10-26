package com.example.vonage.chatsampleapp.data

import androidx.paging.PagingSource
import androidx.paging.PagingState
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.vonage.clientcore.core.api.models.*
import java.lang.RuntimeException

/**
 * Generic Paging Data Source Class
 *
 * @param clientManager The ChatClientManager instance on which to invoke the fetchMethod
 * @param fetchMethod The method to fetch the Data Page (e.g. getConversations)
 */
class PagingDataSource<T : Any, PageT: Page>(
    private val clientManager: ChatClientManager,
    private val fetchMethod: suspend ChatClientManager.(Int, String?) -> PageT
) : PagingSource<Int, T>() {
    private val cursorMap = mutableMapOf<Int, String>()

    override fun getRefreshKey(state: PagingState<Int, T>): Int? {
        return state.anchorPosition?.let { position ->
            val page = state.closestPageToPosition(position)
            page?.prevKey?.minus(1) ?: page?.nextKey?.plus(1)
        }
    }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, T> {
        return try {
            val pageNumber = params.key ?: 1
            val cursor = cursorMap[pageNumber]
            val response = clientManager.fetchMethod(params.loadSize, cursor)
            response.previousCursor?.let {
                cursorMap[pageNumber - 1] = it
            }
            response.nextCursor?.let {
                cursorMap[pageNumber + 1] = it
            }
            @Suppress("UNCHECKED_CAST")
            val data : List<T> = when(response){
                is ConversationsPage -> (response.conversations as List<T>)
                is MembersPage -> (response.members.filterNot {
                    // Filter Out Members who left
                    it.state == MemberState.LEFT
                } as List<T>)
                is EventsPage -> (response.events as List<T>)
                else -> throw RuntimeException("Paging Type Not Supported")
            }

            LoadResult.Page(
                data = data,
                prevKey = response.previousCursor?.let { pageNumber - 1 },
                nextKey = response.nextCursor?.let { pageNumber + 1 }
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}