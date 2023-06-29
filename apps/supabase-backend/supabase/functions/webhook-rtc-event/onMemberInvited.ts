import { z } from 'zod';
import { memberInvitedEvent } from './events.ts';
import { getRTCLogger } from '../logger.ts';

const logger = getRTCLogger('member-invited');

export const onMemberInvited = (event: z.infer<typeof memberInvitedEvent>) => {
    logger.info('Event received');
    logger.debug({ event });
};
