import { z } from 'zod';
import { conversationCreatedEvent } from './events.ts';
import { addUserToConversation, sendFacebookActionMessage } from '../utils.ts';

export const onConversationDeleted = () => {
    console.log('---- CONVERSATION DELETED ----');
};