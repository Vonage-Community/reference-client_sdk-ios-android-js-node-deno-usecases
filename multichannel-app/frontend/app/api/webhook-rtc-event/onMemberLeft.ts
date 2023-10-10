import { z } from 'zod';
import { memberLeftEvent } from './events';
import { Channel, csClient } from '../utils';
import { getRTCLogger } from '../logger';

const logger = getRTCLogger('member-left');

export const onMemberLeft = async (
    event: z.infer<typeof memberLeftEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });
    // check if conversation is messenger
    // if an agent left then send a bot message
    const cid = event.cid || event.conversation_id || '';
    try {
        const conversation = await csClient(`/conversations/${cid}`);
        const prefix = conversation.name.split(':')[0] as Channel;
        const userId = event.body.user.id;

        const reason = event.body.reason?.text;
        if (reason === 'app:user:hangup') {
            await csClient(`/conversations/${cid}/members`, 'POST', {
                user: {
                    id: userId
                },
                channel: {
                    type: 'app'
                },
                state: 'joined'
            });
        }
    } catch (error) {
        logger.error('Error', error);
    }
};
