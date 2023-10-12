import { csClient } from '../utils';
import { getRTCLogger } from '../logger';
import { toogleAssistantBot } from './assistant_bot';

// note: thiw may be uselss, we should trigger this from a text message




async function getActiveMembers(convid: string){
    const membListResOld = await csClient(`/conversations/${convid}/members?page_size=100`, 'GET').catch(e => e);
        if(membListResOld?._embedded?.members){
            membListResOld._embedded.members = membListResOld?._embedded?.members.filter((m:any) => m.state !== 'LEFT');
            membListResOld.memberNumber = membListResOld._embedded.members.length;
        }
    return membListResOld;
}


export const GET = async (req: Request) => {
    try{
        const logger = getRTCLogger('ws-bot');
        const conversationName = new URL(req?.url)?.searchParams?.get('c');
        const assistanBotRes = await toogleAssistantBot(conversationName as string);

        return new Response(JSON.stringify({
            assistanBotRes
            // startCallRes
            
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch(err){
        return new Response(JSON.stringify({
            err   
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }

};