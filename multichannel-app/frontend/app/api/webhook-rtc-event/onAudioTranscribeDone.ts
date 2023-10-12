import { z } from 'zod';
import { audioTranscribeDoneEvent } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';

const logger = getRTCLogger('audio-transcribe-done');

export const onAudioTranscribeDone = async (
    event: z.infer<typeof audioTranscribeDoneEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });


    const conversationId = event.cid ?? event.conversation_id;
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: `Transcription has finished, you can find the result here: ${event.body.transcription_url}`,
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
};
