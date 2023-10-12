import { z } from 'zod';
import { audioSayEvent } from './events';
import { getRTCLogger } from '../logger';
import { kv } from '@vercel/kv';

const logger = getRTCLogger('audio-say');

export const onAudioSay = async (
    event: z.infer<typeof audioSayEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const ttsId = event.body.say_id;

    if (conversationId && ttsId) {
        await kv.set(`conversation:${conversationId}:tts`, ttsId);
    }
};
