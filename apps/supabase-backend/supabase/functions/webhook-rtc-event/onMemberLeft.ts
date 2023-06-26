import { z } from 'zod';
import { memberLeftEvent } from './events.ts';
import { csClient, isAgent, sendBotTextMessage } from '../utils.ts';
import { AdminClient } from '../supabaseClient.ts';


export const onMemberLeft = async (event: z.infer<typeof memberLeftEvent>, req: Request) => {
  const adminClient = await AdminClient(req);
    console.log('---Member Left---', event);
    // check if conversation is messenger 
    // if an agent left then send a bot message
    const cid = event.cid || event.conversation_id || '';
    try {
        const conversation = await csClient(`/conversations/${cid}`, 'GET');
        const prefix = conversation.name.split(':')[0];
        switch (prefix) {
            case 'messenger': {
                const username = event.body.user.name;
                const userDisplayName = event.body.user.display_name || username;
                if (!isAgent(username)) return;
                sendBotTextMessage(cid, `Agent '${userDisplayName}' has left the conversation`);
                // Mark the agent as available
                const { error: err } = await adminClient.rpc('set_user_presence_email', {
                  user_email: username, new_availability: 'ALL', new_status: 'AVAILABLE'
                });
                if (err) {
                  console.log('Failed to set user free', err);
                }
            }
              break;
            default:
              break;
        }
    } catch (error) {
        console.log('Error in onMemberLeft: ', error);
    }
  };