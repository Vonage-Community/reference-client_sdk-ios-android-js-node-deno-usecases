import { z } from 'zod';
import { rtcHangupEvent } from './events';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('rtc:hangup');

export const onRtcHangup = async (
    event: z.infer<typeof rtcHangupEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

};
