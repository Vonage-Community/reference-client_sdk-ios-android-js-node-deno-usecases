import { getUtilsLogger } from './logger';
import { getToken } from './token';

const logger = getUtilsLogger('vonage');

const adminToken = () => getToken();

const VONAGE_ENDPOINT = process.env.VONAGE_ENDPOINT || 'https://api-us-3.vonage.com/v1';
const csClientLogger = getUtilsLogger('csClient');

export const csClient = async <T = any>(
    path: string,
    method = 'GET',
    body?: Record<string, unknown>,
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


export type Channel = 'whatsapp' | 'messenger' | 'sms' | 'viber_service';

export type AgentMemberState = 'JOINED' | 'LEFT';
