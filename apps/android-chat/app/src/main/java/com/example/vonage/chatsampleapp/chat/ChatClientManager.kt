package com.example.vonage.chatsampleapp.chat

import android.content.Context
import com.example.vonage.chatsampleapp.data.ClientContext
import com.example.vonage.chatsampleapp.data.repository.CustomRepository
import com.example.vonage.chatsampleapp.push.NotificationHelper
import com.example.vonage.chatsampleapp.utils.Constants
import com.example.vonage.chatsampleapp.utils.displayName
import com.google.firebase.messaging.RemoteMessage
import com.vonage.android_core.PushType
import com.vonage.android_core.Subscription
import com.vonage.android_core.VGClientConfig
import com.vonage.chat.ChatClient
import com.vonage.clientcore.core.api.LoggingLevel
import com.vonage.clientcore.core.api.SessionErrorReason
import com.vonage.clientcore.core.api.models.*
import com.vonage.clientcore.core.api.setDefaultLoggingLevel
import kotlinx.coroutines.*

class ChatClientManager(
    context: Context,
    private val clientContext: ClientContext,
    private val notificationHelper: NotificationHelper,
    private val repository: CustomRepository,
) {
    private val client : ChatClient
    var sessionId:String? = null
        private set

    /**
     * This var will be set by view models
     * when navigating to a specific Conversation
     */
    lateinit var currentConversation: Conversation
    /**
     * This var will be set internally upon successful login
     */
    lateinit var currentUser: User
        private set

    init {
        setDefaultLoggingLevel(LoggingLevel.Info)

        val config = VGClientConfig()

        client = ChatClient(context)
        client.setConfig(config)
    }

    fun setSessionErrorListener(listener: (SessionErrorReason) -> Unit): Subscription =
        client.setSessionErrorListener(listener)

    fun setConversationEventListener(listener: (ConversationEvent) -> Unit) : Subscription =
        client.setOnConversationEventListener(listener)

    suspend fun login(token: String) : String {
        val sessionId = client.createSession(token, null)
        registerDevicePushToken()
        this.sessionId = sessionId
        clientContext.authToken = token
        clientContext.refreshToken = null
        val user = client.getUser("me")
        currentUser = user
        return sessionId
    }

    suspend fun loginWithCode(code: String) : String {
        val response = repository.login(code)
        return login(response.vonageToken).also {
            clientContext.refreshToken = response.refreshToken
        }
    }

    suspend fun refreshSession() : String {
        this.sessionId = null
        val token = clientContext.refreshToken?.let {
            val response = repository.refresh(it)
            clientContext.refreshToken = response.refreshToken
            response.vonageToken
        } ?: clientContext.authToken
        ?: throw Error("No Token Available")
        return login(token)
    }

    suspend fun logout() {
        unregisterDevicePushToken()
        client.deleteSession().also {
            sessionId = null
            clientContext.authToken = null
            clientContext.refreshToken = null
        }
    }

    suspend fun getUser(username: Username) : User =
        client.getUser(username)

    suspend fun getConversation(conversationId: ConversationId) : Conversation =
        client.getConversation(conversationId)

    suspend fun getMember(conversationId: ConversationId, memberId: MemberId) : Member =
        client.getConversationMember(conversationId, memberId)

    suspend fun getConversations(pageSize: Int = Constants.PAGE_SIZE,
                                 cursor: String? = null,
                                 order: PresentingOrder = Constants.DEFAULT_ORDER) : ConversationsPage =
        client.getConversations(order, pageSize, cursor)

    suspend fun getMembers(pageSize: Int = Constants.PAGE_SIZE,
                          cursor: String? = null,
                          order: PresentingOrder = Constants.DEFAULT_ORDER,
                           conversationId: ConversationId = currentConversation.id) : MembersPage =
        client.getConversationMembers(conversationId, order, pageSize, cursor)

    suspend fun getEvents(pageSize: Int = Constants.PAGE_SIZE,
                          cursor: String? = null,
                          order: PresentingOrder = Constants.DEFAULT_ORDER,
                          conversationId: ConversationId = currentConversation.id) : EventsPage =
        client.getConversationEvents(conversationId, order, pageSize, cursor)

    suspend fun createConversation(name: String, displayName: String?) : ConversationId =
        client.createConversation(name, displayName)

    suspend fun joinConversation(conversationId: ConversationId) : MemberId =
        client.joinConversation(conversationId)

    private suspend fun hasNoOtherMembers(conversationId: ConversationId) : Boolean {
        val page = client.getConversationMembers(pageSize = 2, cid = conversationId)
        return page.members.none { it.user?.name != currentUser.name }
    }

    suspend fun leaveConversation(conversationId: ConversationId){
        client.leaveConversation(conversationId)
        //TODO: Check ASYNCHRONOUSLY if Conversation Needs to be cleaned up
        CoroutineScope(Dispatchers.IO).launch {
            if(hasNoOtherMembers(conversationId)){
                deleteConversation(conversationId)
            }
        }
    }

    suspend fun deleteConversation(conversationId: ConversationId) =
        client.deleteConversation(conversationId)

    suspend fun inviteToConversation(conversationId: ConversationId, username: Username) =
        client.inviteToConversation(conversationId, username)

    suspend fun sendTextMessage(conversationId: ConversationId, message: String) : EventTimestamp =
        client.sendTextMessage(conversationId, message)

    private suspend fun registerDevicePushToken(){
        val token = clientContext.pushToken ?: return
        try {
            val deviceId = client.registerDevicePushToken(token)
            clientContext.deviceId = deviceId
            println("Device Push Token successfully registered with Device ID: $deviceId")
        }catch (e:Exception){
            println("Error in registering Device Push Token: ${e.message}")
        }
    }

    private suspend fun unregisterDevicePushToken(){
        val deviceId = clientContext.deviceId ?: return
        try {
            client.unregisterDevicePushToken(deviceId)
            println("Device Push Token successfully unregistered with Device ID: $deviceId")
        }catch (e:Exception){
            println("Error in unregistering Device Push Token: ${e.message}")
        }
    }
    private fun processIncomingPush(remoteMessage: RemoteMessage) {
        val dataString = remoteMessage.data.toString()
        val type: PushType = ChatClient.getPushNotificationType(dataString)
        println("$type Push Message Received: $dataString")
        val message: MessageEvent = when(type){
            PushType.NEW_MESSAGE -> client.parsePushConversationMessage(dataString) ?: return
            else -> return
        }
        val messageText = when(message){
            is CustomMessageEvent -> message.body.customData
            is TextMessageEvent -> message.body.text
        }
        // TODO: Provide utility to parse Conversation?
        val conversationJson = dataString.substringAfter("\"conversation\":{").substringBefore("}")
        val conversationName = conversationJson.substringAfter("\"name\":\"").substringBefore("\"")
        val conversationDisplayName = conversationJson.substringAfter("\"display_name\":\"", "").substringBefore("\"")
        val conversationTitle = conversationDisplayName.takeUnless { it.isBlank() } ?: conversationName
        notificationHelper.showNotification(
            message.conversationId,
            conversationTitle,
            message.body.sender.displayName(),
            messageText,
            message.timestamp
        )
    }

    fun updatePushToken(token: String) {
        if(token != clientContext.pushToken) {
            clientContext.pushToken = token
        }
    }

    fun processPushMessage(remoteMessage: RemoteMessage){
        // Whenever a Push Notification comes in
        // If there is no active session then
        // Create one using the latest valid Auth Token and notify the ClientManager
        // Else notify the ClientManager directly
        clientContext.run {
            if (sessionId == null) {
                val token = authToken ?: return@run
                CoroutineScope(Dispatchers.Default).launch {
                    login(token)
                    processIncomingPush(remoteMessage)
                }
            } else {
                processIncomingPush(remoteMessage)
            }
        }
    }
}