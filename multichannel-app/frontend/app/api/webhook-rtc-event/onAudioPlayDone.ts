import { z } from 'zod';
import { audioPlayDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-play-done');

export const onAudioPlayDone = async (
    event: z.infer<typeof audioPlayDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
