import { z } from 'zod';
import { audioAsrRecordDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-asr-record-done');

export const onAudioAsrRecordDone = async (
    event: z.infer<typeof audioAsrRecordDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
