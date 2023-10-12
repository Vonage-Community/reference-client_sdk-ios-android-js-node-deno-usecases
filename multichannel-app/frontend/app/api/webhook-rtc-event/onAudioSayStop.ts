import { z } from 'zod';
import { audioSayStopEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-say-stop');

export const onAudioSayStop = async (
    event: z.infer<typeof audioSayStopEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });


    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: 'Text to speech has been stopped',
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
