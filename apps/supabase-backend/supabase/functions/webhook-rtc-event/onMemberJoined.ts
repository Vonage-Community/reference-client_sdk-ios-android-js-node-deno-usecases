import { z } from 'https://deno.land/x/zod@v3.21.4/index.ts';
import { memberJoinedEvent } from './events.ts';
import { csClient,isAgent,sendBotTextMessage } from '../utils.ts';

export const onMemberJoined = async (event: z.infer<typeof memberJoinedEvent>) => {
  console.log('---- MEMBER JOINED ----', event);
    // check if conversation is messenger 
    // if an agent joined then send a bot message
    const cid = event.cid || event.conversation_id || '';
    try {
        const conversation = await csClient(`/conversations/${cid}`, 'GET');
        const prefix = conversation.name.split(':')[0];
        switch (prefix) {
            case 'messenger': {
              const username = event.body.user.name;
              const userDisplayName = event.body.user.display_name || username;
              if (!isAgent(username)) return;
              sendBotTextMessage(cid, `Agent '${userDisplayName}' has joined the conversation`);
              //TODO: mark the agent as busy
            }
              break;
            default:
              break;
        }
    } catch (error) {
        console.log('Error in onMemberJoined: ', error);
    }
};