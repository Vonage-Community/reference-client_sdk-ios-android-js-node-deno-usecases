import { z } from 'zod';
import { audioAsrDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-asr-done');

export const onAudioAsrDone = async (
    event: z.infer<typeof audioAsrDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
