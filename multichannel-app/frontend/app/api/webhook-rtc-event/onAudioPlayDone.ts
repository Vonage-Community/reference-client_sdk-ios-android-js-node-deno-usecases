import { z } from 'zod';
import { audioPlayDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-play-done');

export const onAudioPlayDone = async (
    event: z.infer<typeof audioPlayDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });


    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'Stream has finished',
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
