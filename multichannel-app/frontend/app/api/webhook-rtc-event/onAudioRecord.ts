import { z } from 'zod';
import { audioRecordEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-record');

export const onAudioRecord = async (
    event: z.infer<typeof audioRecordEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
