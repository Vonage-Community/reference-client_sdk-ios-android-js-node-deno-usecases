import { z } from 'zod';
import { audioAsrDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-asr-done');

export const onAudioAsrDone = async (
    event: z.infer<typeof audioAsrDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });


    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'Speech to text has finished',
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
