import { z } from 'zod';
import { audioSayEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-say');

export const onAudioSay = async (
    event: z.infer<typeof audioSayEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
