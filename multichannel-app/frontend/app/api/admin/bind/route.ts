import { getToken } from '../../token';
export const revalidate = 0;
const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_LVN = process.env.VONAGE_LVN;
const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;


export const GET = async (_req: Request) => {
    try {
    const phone_number = VONAGE_LVN;
    const application_id = VONAGE_APPLICATION_ID;
    const WEBHOOKS_URL = `https://${process.env.VERCEL_URL|| process.env.ENDPOINT}/api`;
    const api_key = VONAGE_API_KEY;
    const api_secret = VONAGE_API_SECRET;
    const dev_api_token = Buffer.from((`${api_key}:${api_secret}`)).toString('base64');
    const capabilities = {
        voice: {
            webhooks: {
                answer_url: {
                    address: `${WEBHOOKS_URL}/webhook-voice-answer`,
                    http_method: 'POST'
                },
                event_url: {
                    address: `${WEBHOOKS_URL}/webhook-voice-event`,
                    http_method: 'POST'
                }
            },
        },
        rtc: {
            webhooks: {
                event_url: {
                    address: `${WEBHOOKS_URL}/webhook-rtc-event`,
                    http_method: 'POST'
                }
            },
        },
        messages: {
            webhooks: {
                inbound_url: {
                    address: `${WEBHOOKS_URL}/webhook-message-inbound`,
                    http_method: 'POST'
                },
                status_url: {
                    address: `${WEBHOOKS_URL}/webhook-status-event`,
                    http_method: 'POST'
                }
            },
        },

    };



    const newAppRes = await fetch(`https://api.nexmo.com/v2/applications/${application_id}`, {
        body: JSON.stringify({
            'name': 'Multichannel app',
            capabilities
        }),
        method: 'PUT',
        headers: { 
            'Authorization': `basic ${dev_api_token}`,
            'Content-Type': 'application/json'
        }
    }).then(res => {
        if(!res.ok){
            console.error('update webhooks', res);
           throw Error(res.statusText);
        }else {
            return res.json();
        }
    });
    
    const requestLVN ={
        'country':'GB',
        'msisdn': phone_number as string,
        app_id: application_id as string,
        moHttpUrl: '',
        voiceCallbackType: 'app',
        voiceCallbackValue: application_id as string,
    };
    
    const bindLvnRes = fetch('https://rest.nexmo.com/number/update', {
        method: 'PUT',
        body: new URLSearchParams(requestLVN),
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded' ,
            'Authorization': `basic ${dev_api_token}`,
    
        }
    }).then(res => {
        if(!res.ok){
          console.error(res);
        }else {
            return res.json();
        }
    });


    return new Response(JSON.stringify({ 
        env: {
            VONAGE_API_KEY,
            VONAGE_API_SECRET,
            VONAGE_LVN,
            WEBHOOKS_URL,
            dev_api_token
        },
        newAppRes,
        bindLvnRes
     }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
    } catch(err){
        return new Response(JSON.stringify({ 
            err
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};