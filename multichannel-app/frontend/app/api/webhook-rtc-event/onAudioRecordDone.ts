import { z } from 'zod';
import { audioRecordDoneEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-record-done');

export const onAudioRecordDone = async (
    event: z.infer<typeof audioRecordDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
