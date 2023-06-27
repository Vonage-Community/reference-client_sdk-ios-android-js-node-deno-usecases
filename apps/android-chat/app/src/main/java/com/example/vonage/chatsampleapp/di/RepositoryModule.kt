package com.example.vonage.chatsampleapp.di

import com.example.vonage.chatsampleapp.data.repository.CustomRepository
import com.example.vonage.chatsampleapp.data.repository.CustomRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindCustomRepositoryImpl(
        customRepositoryImpl: CustomRepositoryImpl
    ) : CustomRepository
}