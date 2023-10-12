import { z } from 'zod';
import { audioAsrRecordDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-asr-record-done');

export const onAudioAsrRecordDone = async (
    event: z.infer<typeof audioAsrRecordDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'ASR record done event received available here : ' + event.body.asr.destination_url
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
