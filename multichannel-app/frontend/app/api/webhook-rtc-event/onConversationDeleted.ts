import { getRTCLogger } from '../logger';

const logger = getRTCLogger('conversation-created');

export const onConversationDeleted = () => {
    logger.info('Event received');
    logger.debug({});
};
