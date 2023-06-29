import { getUtilsLogger } from './logger.ts';
import { AdminClient } from './supabaseClient.ts';
import { mintVonageToken } from './token.ts';

const logger = getUtilsLogger('vonage');

const adminToken = () =>
    mintVonageToken(
        Deno.env.get('VONAGE_PRIVATE_KEY') || '',
        Deno.env.get('VONAGE_APPLICATION_ID') || '',
    );

const VONAGE_ENDPOINT = Deno.env.get('VONAGE_ENDPOINT') || '';
const csClientLogger = getUtilsLogger('csClient');

export const csClient = async <T = any>(
    path: string,
    method = 'GET',
    body?: Record<string, unknown>,
    token?: string,
    headers?: Record<string, string>,
): Promise<T> => {
    csClientLogger.debug(`${method} ${path}`);
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
            `Error ${method} ${path} ${res.status} ${res.statusText}`,
        );
        throw Error(
            `Error ${method} ${path} ${res.status} ${res.statusText}`,
        );
    }
    if (!res.body) return {} as T;
    return await res.json();
};

export const addUserToConversation = async (cid: string, userName: string) => {
    logger.debug(`Adding user ${userName} to conversation ${cid}`);
    logger.debug(`Getting list of members in conversation ${cid}`);
    const memberList = await csClient(`/conversations/${cid}/members`, 'GET');
    const mids = (memberList._embedded.members as any[]).filter((member) =>
        member._embedded.user.name === userName && member.state === 'JOINED'
    ).map((member) => member.id);
    if (mids.length > 0) {
        logger.debug(`User ${userName} already in conversation ${cid}`);
        return mids[0];
    }

    logger.debug(`User ${userName} not in conversation ${cid}, adding`);

    return (await csClient(`/conversations/${cid}/members`, 'POST', {
        user: {
            name: userName,
        },
        state: 'JOINED',
        channel: {
            type: 'app',
            preanswer: false,
        },
    })).id;
};

export const deleteUserData = async (cid: string, userId: string) => {
    try {
        logger.debug('Deleting Conversation');
        await csClient(`/conversations/${cid}`, 'DELETE');
        logger.debug('Deleting User');
        await csClient(`/users/${userId}`, 'DELETE');
    } catch (error) {
        logger.debug('Error deleteing user data', error);
    }
};

export const conversationHasAgents = async (cid: string) => {
    logger.debug(`conversationHasAgents: ${cid}`);
    try {
        const memberList = await csClient(`/conversations/${cid}/members`);
        const agents = (memberList._embedded.members as any[]).filter(
            (member) => {
                const name = member._embedded.user.name;
                return (isAgent(name)) && member.state === 'JOINED';
            },
        );
        return agents.length > 0;
    } catch (error) {
        logger.error('conversationHasAgents', error);
        return false;
    }
};

export const setAgentStatus = async (
    username: string,
    newStatus: 'AVAILABLE' | 'OFFLINE' | 'BUSY' | 'DO_NOT_DISTURB',
) => {
    const adminClient = AdminClient();
    const { data, error } = await adminClient
        .from('users_view')
        .select('availability')
        .eq('email', username)
        .maybeSingle();
    if (error) throw error;
    const availability = data?.availability!;
    logger.debug(`Setting agent status to ${newStatus}`);
    const { error: err } = await adminClient.rpc(
        'set_user_presence_email',
        {
            user_email: username,
            new_availability: availability,
            new_status: newStatus,
        },
    );
    if (err) {
        logger.error(`Failed to set user ${newStatus}`, err);
    }
};

export const isCustomer = (username: string) => username.includes(':customer:');

export const isBot = (username: string) => username.includes('bot:');

export const isAgent = (username: string) =>
    !(isCustomer(username) || isBot(username));

export type Channel = 'whatsapp' | 'messenger' | 'sms' | 'viber_service';

export type AgentMemberState = 'JOINED' | 'LEFT';
