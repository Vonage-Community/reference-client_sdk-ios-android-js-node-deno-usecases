import { z } from 'zod';
import { audioSayDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-say-done');

export const onAudioSayDone = async (
    event: z.infer<typeof audioSayDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'Text to speech has finished',
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
