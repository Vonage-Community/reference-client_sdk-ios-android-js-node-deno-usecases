import { z } from 'zod';
import { messageEvent } from './events.ts';
import { conversationHasAgents, csClient, isCustomer } from '../utils.ts';
import { getRTCLogger } from '../logger.ts';
import {
    actionConnect,
    actionStop,
    sendBotTextMessage,
    sendFacebookActionMessage,
    sendSMSActionMessage,
    sendWhatsappActionMessage,
} from '../chatActions.ts';

const logger = getRTCLogger('message');

export const onMessage = async (event: z.infer<typeof messageEvent>) => {
    logger.info('Event received');
    logger.debug({ event });
    // check if conversation is messanger
    // verify if the chat has an agent or not
    // if not send action message again
    const cid = event.cid || event.conversation_id || '';

    try {
        const conversation = await csClient(`/conversations/${cid}`, 'GET');
        const prefix = conversation.name.split(':')[0];
        const sender = event._embedded?.from_user?.name || '';
        logger.info('Checking if sender is a customer');
        if (!isCustomer(sender)) return;
        if (event.body.text == 'STOP' && prefix == 'sms') {
            const userId = event._embedded?.from_user?.id || '';
            await actionStop(cid, userId);
            return;
        }
        logger.debug('Checking if conversation has agents');
        const hasAgents = await conversationHasAgents(cid);
        if (hasAgents) return;
        logger.debug('No agents in conversation');
        switch (prefix) {
            case 'messenger':
                await sendFacebookActionMessage(cid);
                break;
            case 'whatsapp':
                await sendWhatsappActionMessage(cid);
                break;
            case 'sms':
                if (event.body.text == 'CONNECT') {
                    await actionConnect(cid, 'sms');
                } else {
                    await sendSMSActionMessage(cid);
                }
                break;
            case 'viber_service':
                // change later for viber, this is for test
                await sendBotTextMessage(
                    cid,
                    'Hi, welocme to Mehboob\'s Corner, how can we help you?',
                );
                break;
            default:
                logger.debug('Conversation name prefix not matched');
                break;
        }
    } catch (error) {
        logger.error('Error onMessage', error);
    }
};
