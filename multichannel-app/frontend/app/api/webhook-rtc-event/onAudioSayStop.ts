import { z } from 'zod';
import { audioSayStopEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-say-stop');

export const onAudioSayStop = async (
    event: z.infer<typeof audioSayStopEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
