import { createClient } from '@vercel/kv';
import { kv } from '@vercel/kv';
import { getRTCLogger } from '../../logger';
import { csClient, getConversationIdByName } from '../../utils';

const logger = getRTCLogger('ws-assistant-events');

export const POST = async (req: Request) => {
    logger.info('assistant events reached', req);
    const oldCounter = await kv.get('assistant');
    const newVal = (parseInt(oldCounter as string) || 0) + 1;
    await kv.set('counter', newVal);

    const reqObj = await req.json();
    const conversationName = reqObj.conversation;

    const conversationId = await getConversationIdByName(conversationName as string);
    const reqBody = {
        type: 'message',
        body: {
            message_type: 'text',
            text: reqObj?.data?.choices[0]?.message?.content,
        }
    };

    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);

     return new Response(JSON.stringify({
           text:'yolloe',
           counter: newVal
            
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

};

