import { kv } from '@vercel/kv';
import { getToken } from '../token';

type HealthResponseKeys = 'ping'| 'ws_bot_ping' | 'application' | 'env_vars' | 'token' | 'kv';
type HealthResponse = {
    healthy: {
        [key in HealthResponseKeys]?: boolean
    },
    error_message: {
        [key in HealthResponseKeys]?: string 
    }
}
type TestResult =  { type: HealthResponseKeys, healty: boolean, err?: string};

function assignResult(resp: HealthResponse, res: TestResult): HealthResponse {
    if(res.healty){
        resp.healthy[res.type] = true;
    }else{
        resp.healthy[res.type] = false;
        resp.error_message[res.type] = res.err as string;
    }
    return resp;
}

function networkTestGet(url: string, type: HealthResponseKeys): Promise<TestResult> {
    return fetch(url,{cache: 'no-cache'}).then((res) => {
        if(!res.ok){
            return res.text().then(text => ({
                healty: false,
                err: text as string
            }));
        }
        return res.json().then(res => {
            return { healty: true };
        });    
    }).catch(err => ({
        healty: false,
        err: `error getting this url: ${url}. ${err.toString()}`
    })).then(res => ({
        ...res,
        type
    })); 

}

export const GET = async (_req: Request) => {
    
    
    const endpoint = process.env.ENDPOINT;
    const webhooks_host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`:endpoint;

    const ws_bot_url = process.env.WS_BOT_URL;
    const pingRes: Promise<TestResult> = networkTestGet(`${webhooks_host}/api/ping`, 'ping');
    const wsBotPingRes: Promise<TestResult> = networkTestGet(`${ws_bot_url}/ping`, 'ws_bot_ping');

    const tokenRes:Promise<TestResult> = getToken()
        .then(token => ({
            healty: true
        })).catch(err => ({
            healty: false,
            err: err as string
        })).then((res ) => ({
            ...res,
            type: 'token'
        }));

    const kvTestRes: Promise<TestResult> = kv.set('test', 'test').then(val => kv.del('test'))
        .then(res => ({healty: true }))
        .catch(err => ({
            healty: false,
            err: err as string
        }))
        .then((res ) => ({
            ...res,
            type: 'kv'
        }));

    const resp:HealthResponse = {
        healthy: {},
        error_message: {}
    };
    const responses: TestResult[] = await Promise.all<TestResult>([
        pingRes,
        wsBotPingRes,
        tokenRes,
        kvTestRes]);
    
    responses.forEach(result =>{
        assignResult(resp, result);
    })
    ;
    
    return new Response(JSON.stringify(resp), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};