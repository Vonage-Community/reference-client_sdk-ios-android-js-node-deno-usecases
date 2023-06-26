import { z } from 'zod';
import { conversationCreatedEvent } from './events.ts';
// import { sendFacebookActionMessage } from '../utils.ts';

export const onConversationCreated = (event: z.infer<typeof conversationCreatedEvent>) => {
  console.log('-- Conversation Created --', event);
};