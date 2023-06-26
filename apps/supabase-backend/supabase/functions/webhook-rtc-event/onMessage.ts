import { z } from 'zod';
import { messageEvent } from './events.ts';
import { csClient, conversationHasAgents, sendFacebookActionMessage, isCustomer } from '../utils.ts';


export const onMessage = async (event: z.infer<typeof messageEvent>) => {
    console.log('---Message--', event);
    // check if conversation is messanger 
    // verify if the chat has an agent or not
    // if not send action message again
    const cid = event.cid || event.conversation_id || '';
    
    try {
        const conversation = await csClient(`/conversations/${cid}`, 'GET');
        const prefix = conversation.name.split(':')[0];
        switch (prefix) {
            case 'messenger': {
                const sender = event._embedded?.from_user?.name || '';
                if (!isCustomer(sender)) return;
                const hasAgents = await conversationHasAgents(cid);
                if (!hasAgents) {
                    await sendFacebookActionMessage(cid);
                }
            }
              break;
            default:
              break;
        }
    } catch (error) {
        console.log('Error in onMessage: ', error);
    }
};
