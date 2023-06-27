package com.example.vonage.chatsampleapp.di

import android.content.Context
import androidx.paging.InvalidatingPagingSourceFactory
import com.example.vonage.chatsampleapp.chat.ChatClientManager
import com.example.vonage.chatsampleapp.data.ClientContext
import com.example.vonage.chatsampleapp.data.remote.CustomApi
import com.example.vonage.chatsampleapp.data.PagingDataSource
import com.example.vonage.chatsampleapp.data.repository.CustomRepository
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.vonage.clientcore.core.api.models.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Singleton
    @Provides
    fun provideClientContext(@ApplicationContext context: Context) =
        ClientContext(context)

    @Singleton
    @Provides
    fun provideCustomApi() : CustomApi =
        Retrofit.Builder()
            // Placeholder base URL:
            // full URLs are specified for each endpoint
            .baseUrl("http://example.com/")
            .addConverterFactory(MoshiConverterFactory.create(
                Moshi.Builder()
                    .add(KotlinJsonAdapterFactory())
                    .build()
            ))
            .build()
            .create(CustomApi::class.java)

    @Singleton
    @Provides
    fun provideChatClientManager(
        @ApplicationContext context: Context,
        clientContext: ClientContext,
        customRepository: CustomRepository
    ) =
        ChatClientManager(context, clientContext, customRepository)

    @Provides
    fun provideConversationsPageFactory(clientManager: ChatClientManager) =
        InvalidatingPagingSourceFactory {
            PagingDataSource<Conversation, ConversationsPage>(
                clientManager,
                ChatClientManager::getConversations
            )
        }

    @Provides
    fun provideMembersPageFactory(clientManager: ChatClientManager) =
        InvalidatingPagingSourceFactory {
            PagingDataSource<Member, MembersPage>(
                clientManager,
                ChatClientManager::getMembers
            )
        }

    @Provides
    fun provideEventsPageFactory(clientManager: ChatClientManager) =
        InvalidatingPagingSourceFactory {
            PagingDataSource<ConversationEvent, EventsPage>(
                clientManager,
                ChatClientManager::getEvents
            )
        }
}