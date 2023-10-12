import { getUtilsLogger } from './logger';
import { getToken } from './token';
import { z } from 'zod';
import { kv } from '@vercel/kv';

const logger = getUtilsLogger('vonage');

const adminToken = () => getToken();

const VONAGE_ENDPOINT = process.env.VONAGE_ENDPOINT || 'https://api-us-3.vonage.com/v1';
const csClientLogger = getUtilsLogger('csClient');

export const csClient = async <T = any>(
    path: string,
    method = 'GET',
    body?: object,
    token?: string,
    headers?: Record<string, string>,
): Promise<T> => {
    csClientLogger.debug(`${method} ${VONAGE_ENDPOINT}/${path}`);
    const res = await fetch(`${VONAGE_ENDPOINT}${path}`, {
        method,
        headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || await adminToken()}`,
            'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        csClientLogger.error(
            `Error ${method} ${path} ${res.status} ${res.statusText} ${await res.text()}`,
        );
        throw res;
    }
    if (!res.body) return res as any;
    return await res.json();
};
export type Channel = 'whatsapp' | 'messenger' | 'sms' | 'viber_service';

export type AgentMemberState = 'JOINED' | 'LEFT';

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    display_name: z.string().optional(),
    image_url: z.string().optional(),
}).passthrough();

export const getOrCreateUser = (email: string, userOptions: object = {}): Promise<z.infer<typeof userSchema>> => {
    return csClient(`/users/${email}`, 'GET')
        .then(userSchema.parse)
        .catch(e => {
            if (e instanceof Response && e.status == 404) {
                console.error(e);
                return csClient('/users', 'POST', {
                    name: `${email}`,
                    display_name: email.split('@')[0],
                    image_url: `https://picsum.photos/seed/${email}/200/200`,
                    ...userOptions,
                });
            }
        }) as Promise<z.infer<typeof userSchema>>;
};



export const sendMessage = (cid: string, message: {type: string, body: object}) => {
    return csClient(`/conversations/${cid}/events`, 'POST', message);
};

export const getConversationName =  async (cid: string) : Promise<string> => {
    const convKey = `convname:${cid}`;
    const name = await kv.get(convKey) as string;
    if(!name){
        const convRes = await csClient(`/conversations/${cid}`, 'GET');
        const name = convRes.name as string;
        await kv.set(convKey, name);
        return name;
    }else {
        return name;
    }
};

export const startWithOrExact = (str: string, matchString: string) => {
    return str.startsWith(matchString+' ') || str === matchString;
}