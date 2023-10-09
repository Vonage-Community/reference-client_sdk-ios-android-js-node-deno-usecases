import { z } from 'zod';
import { memberLeftEvent } from './events.ts';
import { Channel, csClient, isAgent, setAgentStatus } from '../utils.ts';
import { getRTCLogger } from '../logger.ts';
import { sendAgentStateUpdate } from '../chatActions.ts';

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
        const userId = event.body.user.id

        const reason = event.body.reason?.text
        if(reason === "app:user:hangup"){
            await csClient(`/conversations/${cid}/members`, 'POST', {
                user: {
                    id: userId
                },
                channel: {
                    type: "app"
                },
                state: "joined"
            })
        }


        // switch (prefix) {
        //     case 'whatsapp':
        //     case 'viber_service':
        //     case 'sms':
        //     case 'messenger':
        //         {
        //             logger.debug('Messenger conversation');
        //             const username = event.body.user.name;
        //             const userDisplayName = event.body.user.display_name ||
        //                 username;
        //             if (!isAgent(username)) return;
        //             sendAgentStateUpdate(cid, prefix, userDisplayName, 'LEFT');
        //             // Mark the agent as available
        //             await setAgentStatus(username, 'AVAILABLE');
        //         }
        //         break;
        //     default:
        //         logger.warning('Unsupported Channel');
        //         break;
        // }
    } catch (error) {
        logger.error('Error', error);
    }
};
