import { z } from 'zod';
import { memberMediaEvent } from './events';
import { getRTCLogger } from '../logger';
import { kv } from '@vercel/kv';

const logger = getRTCLogger('member-media');

export const onMemberMedia = async (
    event: z.infer<typeof memberMediaEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;
    const legId = event.body?.channel.id;
    const userName = event._embedded?.from_user?.name;

    if (event.body?.audio && conversationId && legId && userName) {
        await kv.set(`user:${userName}:conversation:${conversationId}`, legId);
    }
};
