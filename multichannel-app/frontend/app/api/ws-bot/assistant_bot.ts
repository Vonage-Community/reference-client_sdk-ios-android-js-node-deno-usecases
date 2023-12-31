import { csClient } from '../utils';
import { getRTCLogger } from '../logger';
import { kv } from '@vercel/kv';

function urlWss(url:string){
    if(url.includes('https://')){
        return url.replace('https://','wss://' );
    }else if(url.includes('://')){
        return url;
    } else {
        return `wss://${url}`;
    }
}


export async function toogleAssistantBot(convName:string) : Promise<{ 
    leg_id: string 
    type: 'assistant',
    enabled: boolean
}>{
    const logger = getRTCLogger('ws-assitant-bot');
    const wsBotUrl = urlWss(process.env.WS_BOT_URL as string);
    const assistantKVKey = 'assistant'+convName;

    const assistant_leg_id = await kv.get(assistantKVKey) as string;
    logger.info('assistant_leg_id' , {key: assistant_leg_id});

    if(assistant_leg_id){
        logger.info('disabling assistant on conversation', convName);
        await csClient(`/calls/${assistant_leg_id}`, 'PUT', {action: 'hangup'}).catch(e => logger.error('error hanging up assistant leg', e));
        await kv.set(assistantKVKey,'');

        return {
            leg_id:assistant_leg_id,
            type: 'assistant',
            enabled:false 

        };
    }else{
        logger.info('enabling assistant on conversation', convName);
        const startCallRes = await csClient('/calls', 'POST', {
             'random_from_number': true,
             'to': [
                    {   
                        'type': 'websocket',
                        'uri': `${wsBotUrl}/assistant?webhook_method=POST&webhook_url=${process.env.ENDPOINT}/api/ws-bot/assistant-events&webhook_param_name=conversation&webhook_param_value=${convName}`,
                        'content-type': 'audio/l16;rate=16000',
                        'headers': {
                            'app': 'audiosocket'
                        }
                    }
            ], 
            'ncco': [
                {
                    'action': 'conversation',
                    'name': convName
                }
            ]
        });
        const leg_id = startCallRes.uuid;

        try {
            const { _embedded: { user: { id: userId } } } = await csClient(`/legs/${leg_id}`, 'GET');

            await csClient(`/users/${userId}`, 'PATCH', {
                name: 'assistant:ws',
                display_name: 'Yoda Assistant',
                image_url: 'https://avatarfiles.alphacoders.com/170/170909.jpg'
            });

        } catch (e) {
            // if there's an error setting the user, we don't care, just log it
            logger.error('error setting assistant user', e);
        }

        await kv.set(assistantKVKey, leg_id);
        return {
            leg_id,
            type: 'assistant',
            enabled:true 
        };

    } 

    
}