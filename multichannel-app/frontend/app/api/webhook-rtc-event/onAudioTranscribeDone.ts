import { z } from 'zod';
import { audioTranscribeDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-transcribe-done');

export const onAudioTranscribeDone = async (
    event: z.infer<typeof audioTranscribeDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
