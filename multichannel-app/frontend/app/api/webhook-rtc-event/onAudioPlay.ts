import { z } from 'zod';
import { audioPlayEvent } from './events';
import { getRTCLogger } from '../logger';
import { kv } from '@vercel/kv';

const logger = getRTCLogger('audio-play');

export const onAudioPlay = async (
    event: z.infer<typeof audioPlayEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const streamId = event.body.play_id;

    if (conversationId && streamId) {
        await kv.set(`conversation:${conversationId}:stream`, streamId);
    }
};
