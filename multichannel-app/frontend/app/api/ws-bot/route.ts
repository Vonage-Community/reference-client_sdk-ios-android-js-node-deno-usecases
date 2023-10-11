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
        const wsBotUrl = urlWss(process.env.WS_BOT_URL as string)
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
                        'uri': `${wsBotUrl}/echo`,
                        'content-type': 'audio/l16;rate=16000',
                        'headers': {
                            'app': 'audiosocket'
                        }
                    }
            ], 
            'ncco': [
                // {
                //     'action': 'talk',
                //     'text': 'Echo bot enabled'
                // },
                {
                    'action': 'conversation',
                    'name': conversationName
                }
            ]
        });

        // try {
        //     await csClient('/users', 'POST', {
        //         name: userBotName,
        //         display_name: 'bot echo (ws)'
        //     });
        // }catch(err){
        //     logger.warning('user create error', { err});
        // }

        // const membRes = await csClient(`/conversations/${convid}/members`, 'POST', {
        //     user: {
        //         name: userBotName
        //     },
        //     state: 'invited',
        //     channel: {
        //         type: 'websocket',
        //         to: {
        //             type: 'websocket',
        //             uri: `${wsBotUrl}/echo`,
        //             'content-type': 'audio/l16;rate=8000',
        //         }
        //     }
        // }).catch(e=>e);

        
        // const membListRes = await getActiveMembers(convid).catch(e => e);
        // logger.info(`£££££££££££££££££££££ adofiaoisudfoaisudf `);

        // for(let m of membListRes?._embedded?.members){
        //     if(m._embedded.user.name === 'ws-bot-echo'){
        //         logger.info('--- memmber s-bot-echo', m)
        //         const delRes = await csClient(`/conversations/${convid}/members/${m.id}`, 'PATCH', {state:'LEFT'});
        //         logger.info(delRes);
        //     } 
        // }

        // const membRes = await csClient(`/conversations/${convid}/members/MEM-de2cbc78-4cc6-4901-8b8b-cf3cbf4de51a`);

        return new Response(JSON.stringify({
            // conversation: convid,
            ws_bot_url: wsBotUrl,
            startCallRes
            // membRes:{},
            // membListRes
            // res
            
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