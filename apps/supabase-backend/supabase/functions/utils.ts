import { mintVonageToken } from './token.ts';

const adminToken = () => mintVonageToken(Deno.env.get('VONAGE_PRIVATE_KEY') || '', Deno.env.get('VONAGE_APPLICATION_ID') || '');

const VONAGE_ENDPOINT = Deno.env.get('VONAGE_ENDPOINT') || '';
const BOT_NAME = Deno.env.get('BOT_NAME') ?? 'bot:vonage';

export const csClient = async <T = any>(path: string, method = 'GET', body?: Record<string, unknown>, token?: string, headers?: Record<string, string>): Promise<T> => {
    const res = await fetch(`${VONAGE_ENDPOINT}${path}`, {
        method,
        headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || await adminToken()}`,
            'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) throw Error(`Error in ${method} ${path} ${res.status} ${res.statusText}`);

    return await res.json();
};

export const addUserToConversation = async (cid: string, userName: string) => {
    const memberList = await csClient(`/conversations/${cid}/members`, 'GET');
    const mids = (memberList._embedded.members as any[]).filter(member => member._embedded.user.name === userName && member.state === 'JOINED').map(member => member.id);
    if (mids.length > 0) return mids[0];

    return (await csClient(`/conversations/${cid}/members`, 'POST', {
        user: {
            name: userName
        },
        state: 'JOINED',
        channel: {
            type: 'app',
            preanswer: false
        }
    })).id;
};

export const sendBotTextMessage = async (cid: string, text: string) => {
    const botMid = await addUserToConversation(cid, BOT_NAME);
    await csClient(`/conversations/${cid}/events`, 'POST', {
        type: 'message',
        from: botMid,
        body: {
            message_type: 'text',
            text: text
        }
    });
};

export const sendFacebookActionMessage = async (cid: string) => {
    const botMid = await addUserToConversation(cid, BOT_NAME);
    return await csClient(`/conversations/${cid}/events`, 'POST', {
        type: 'message',
        from: botMid,
        body: {
            message_type: 'custom',
            custom: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: 'Hi, My name is Mehboob Alam, Welcome to Mehboob\'s corner. How can We help you?',
                        buttons: [
                            {
                                type: 'postback',
                                title: 'Connect to an agent',
                                payload: `{"cid": "${cid}","action": "connect"}`
                            },
                            {
                                type: 'postback',
                                title: 'No, Thanks',
                                payload: `{"cid": "${cid}","action": "none"}`
                            }
                        ]
                    }
                }
            }
        }
    });
};

export const conversationHasAgents = async (cid: string) => {
    try {
        const memberList = await csClient(`/conversations/${cid}/members`, 'GET');
        const agents = (memberList._embedded.members as any[]).filter(member => {
            const name = member._embedded.user.name;
            return (isAgent(name)) && member.state === 'JOINED';
        });
        return agents.length > 0;
    } catch (error) {
        console.log('Error on fetching member in conversationHasAgents: ', error);
        return false;
    }
};

export const isCustomer = (username: string) => username.includes(':customer:');

export const isBot = (username: string) => username.includes('bot:');

export const isAgent = (username: string) => !(isCustomer(username) || isBot(username));