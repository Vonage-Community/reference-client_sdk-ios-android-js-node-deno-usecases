import { z } from 'zod';
import { audioSayDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-say-done');

export const onAudioSayDone = async (
    event: z.infer<typeof audioSayDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
