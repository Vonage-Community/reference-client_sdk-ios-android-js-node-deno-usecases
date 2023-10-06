import { z } from 'zod';
import { conversationCreatedEvent } from './events.ts';
import { getRTCLogger } from '../logger.ts';
const logger = getRTCLogger('conversation-created');
export const onConversationCreated = (
    event: z.infer<typeof conversationCreatedEvent>,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
