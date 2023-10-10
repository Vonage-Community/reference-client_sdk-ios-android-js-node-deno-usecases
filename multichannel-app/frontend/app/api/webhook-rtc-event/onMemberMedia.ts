import { z } from 'zod';
import { memberMediaEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('member-media');

export const onMemberMedia = async (
    event: z.infer<typeof memberMediaEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
