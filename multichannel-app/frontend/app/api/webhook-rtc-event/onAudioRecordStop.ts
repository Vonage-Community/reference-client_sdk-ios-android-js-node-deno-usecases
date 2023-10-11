import { z } from 'zod';
import { audioRecordStopEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('audio-record-stop');

export const onAudioRecordStop = async (
    event: z.infer<typeof audioRecordStopEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
};
