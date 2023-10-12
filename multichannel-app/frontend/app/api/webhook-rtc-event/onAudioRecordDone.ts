import { z } from 'zod';
import { audioRecordDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-record-done');

export const onAudioRecordDone = async (
    event: z.infer<typeof audioRecordDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });


    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'Record done event received available here : ' + event.body.destination_url
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
