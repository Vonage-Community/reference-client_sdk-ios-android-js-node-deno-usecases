import { z } from 'zod';
import { conversationCreatedEvent } from './events';
import { getRTCLogger } from '../logger';
const logger = getRTCLogger('conversation-created');
export const onConversationCreated = (
    event: z.infer<typeof conversationCreatedEvent>,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
