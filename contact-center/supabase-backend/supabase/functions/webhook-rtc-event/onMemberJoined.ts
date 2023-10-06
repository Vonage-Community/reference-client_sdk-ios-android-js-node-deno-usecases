import { z } from 'https://deno.land/x/zod@v3.21.4/index.ts';
import { memberJoinedEvent } from './events.ts';
import { Channel, csClient, isAgent, setAgentStatus } from '../utils.ts';
import { getRTCLogger } from '../logger.ts';
import { sendAgentStateUpdate } from '../chatActions.ts';

const logger = getRTCLogger('member-joined');

export const onMemberJoined = async (
    event: z.infer<typeof memberJoinedEvent>,
) => {
    logger.info('Event received');
    logger.debug({ event });
    // check if conversation is messenger
    // if an agent joined then send a bot message
    const cid = event.cid || event.conversation_id || '';
    try {
        const conversation = await csClient(`/conversations/${cid}`, 'GET');
        const prefix = conversation.name.split(':')[0] as Channel;
        switch (prefix) {
            case 'whatsapp':
            case 'viber_service':
            case 'sms':
            case 'messenger':
                {
                    const username = event.body.user.name;
                    const userDisplayName = event.body.user.display_name ||
                        username;
                    logger.debug('checking if agent');
                    if (!isAgent(username)) return;
                    await sendAgentStateUpdate(
                        cid,
                        prefix,
                        userDisplayName,
                        'JOINED',
                    );
                    //Mark the agent as busy
                    await setAgentStatus(username, 'BUSY');
                }
                break;
            default:
                logger.warning('Unsupported Channel');
                break;
        }
    } catch (error) {
        logger.error('Error', error);
    }
};
