import { getUtilsLogger } from './logger.ts';
import { AdminClient } from './supabaseClient.ts';
import {
    addUserToConversation,
    AgentMemberState,
    Channel,
    conversationHasAgents,
    csClient,
    deleteUserData,
} from './utils.ts';
import messages from './botMessages.json' assert { type: 'json' };

const BOT_NAME = Deno.env.get('BOT_NAME') ?? 'bot:vonage';
const logger = getUtilsLogger('chatActions');

export const actionNone = async (
    cid: string,
    channel: 'messenger' | 'whatsapp',
) => {
    logger.debug('Sending action none response');
    return await sendBotTextMessage(cid, messages[channel].actionNoneResponse);
};

export const actionConnect = async (cid: string, channel: Channel) => {
    try {
        const adminClient = AdminClient();
        const hasAgents = await conversationHasAgents(cid);
        if (hasAgents) return;
        // Find the first available agent and mark it as BUSY
        logger.debug('Finding agent');
        const { data, error } = await adminClient.from(
            'user_available_view_chat',
        ).select('*').limit(1).maybeSingle();
        if (!data || error) {
            logger.error('Error fetching agent from supabase', error, data);
            return await sendBotTextMessage(
                cid,
                messages[channel].noAvailableAgents,
            );
        }
        await addUserToConversation(cid, data.email!);
    } catch (error) {
        logger.error('Error actionConnect', error);
    }
};

export const actionStop = async (cid: string, userId: string) => {
    logger.debug('Received STOP command via SMS');
    await sendBotTextMessage(
        cid,
        messages.sms.actionStopResponse,
    );
    await deleteUserData(
        cid,
        userId,
    );
};

export const sendBotTextMessage = async (cid: string, text: string) => {
    logger.debug(`Sending text message to conversation ${cid}, ${text}`);
    const botMid = await addUserToConversation(cid, BOT_NAME);
    await csClient(`/conversations/${cid}/events`, 'POST', {
        type: 'message',
        from: botMid,
        body: {
            message_type: 'text',
            text: text,
        },
    });
};

export const sendAgentStateUpdate = async (
    cid: string,
    channel: Channel,
    agentName: string,
    state: AgentMemberState,
) => {
    logger.debug(`Agent ${state.toLowerCase}`);
    const message = state == 'JOINED'
        ? messages[channel].agentJoined
        : messages[channel].agentLeft;
    await sendBotTextMessage(
        cid,
        message.replace(
            '$AGENT_USER',
            agentName,
        ),
    );
};

export const sendFacebookActionMessage = async (cid: string) => {
    logger.debug(`Sending facebook action message to conversation ${cid}`);
    const botMid = await addUserToConversation(cid, BOT_NAME);
    return await csClient(`/conversations/${cid}/events`, 'POST', {
        type: 'message',
        from: botMid,
        body: {
            message_type: 'custom',
            custom: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: messages.messenger.welcome,
                        buttons: [
                            {
                                type: 'postback',
                                title: messages.messenger.actionConnect,
                                payload:
                                    `{"cid": "${cid}","action": "connect"}`,
                            },
                            {
                                type: 'postback',
                                title: messages.messenger.actionNone,
                                payload: `{"cid": "${cid}","action": "none"}`,
                            },
                        ],
                    },
                },
            },
        },
    });
};

export const sendWhatsappActionMessage = async (cid: string) => {
    logger.debug(`Sending Whatsapp action message to conversation ${cid}`);
    const botMid = await addUserToConversation(cid, BOT_NAME);
    return await csClient(`/conversations/${cid}/events`, 'POST', {
        type: 'message',
        from: botMid,
        body: {
            message_type: 'custom',
            custom: {
                type: 'interactive',
                interactive: {
                    type: 'button',
                    header: {
                        type: 'text',
                        text: messages.whatsapp.welcome.header,
                    },
                    body: {
                        text: messages.whatsapp.welcome.body,
                    },
                    footer: {
                        text: messages.whatsapp.welcome.footer,
                    },
                    action: {
                        buttons: [{
                            type: 'reply',
                            reply: {
                                id: `connect-agent:${cid}`,
                                title: messages.whatsapp.actionConnect,
                            },
                        }, {
                            type: 'reply',
                            reply: {
                                id: `none:${cid}`,
                                title: messages.whatsapp.actionNone,
                            },
                        }],
                    },
                },
            },
        },
    });
};

export const sendSMSActionMessage = async (cid: string) => {
    logger.debug(`Sending SMS action message to conversation ${cid}`);
    return await sendBotTextMessage(
        cid,
        `${messages.sms.welcome}\n${messages.sms.actionConnect}\n${messages.sms.actionStop}`,
    );
};
