import { csClient } from '../utils';
import { getRTCLogger } from '../logger';

// note: thiw may be uselss, we should trigger this from a text message

function urlWss(url:string){
    if(url.includes('https://')){
        return url.replace('https://','wss://' );
    }else if(url.includes('://')){
        return url;
    } else {
        return `wss://${url}`;
    }
}


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
        const wsBotUrl = urlWss(process.env.WS_BOT_URL as string);
        const conversationName = new URL(req?.url)?.searchParams?.get('c');
        // console.log(`req`, conversation);
        // const convRes = await csClient(`/conversations?name=${conversationName}`);
        // const convid = convRes._embedded.conversations[0]?.id;
        
        const userBotName = 'ws-bot-echo';
        const startCallRes = await csClient('/calls', 'POST', {
             'random_from_number': true,
             'to': [
                    {   
                        'type': 'websocket',
                        'uri': `${wsBotUrl}/assistant`,
                        'content-type': 'audio/l16;rate=16000',
                        'headers': {
                            'app': 'audiosocket'
                        }
                    }
            ], 
            'ncco': [
                {
                    'action': 'conversation',
                    'name': conversationName
                }
            ]
        });

       
        return new Response(JSON.stringify({
            ws_bot_url: wsBotUrl,
            startCallRes
            
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