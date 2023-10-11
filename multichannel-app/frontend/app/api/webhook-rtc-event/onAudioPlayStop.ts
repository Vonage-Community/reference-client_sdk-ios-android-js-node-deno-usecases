import { z } from 'zod';
import { audioPlayStopEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-play-stop');

export const onAudioPlayStop = async (
    event: z.infer<typeof audioPlayStopEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
