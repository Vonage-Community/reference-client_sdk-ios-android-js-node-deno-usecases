import { z } from 'zod';
import { audioPlayEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-play');

export const onAudioPlay = async (
    event: z.infer<typeof audioPlayEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
