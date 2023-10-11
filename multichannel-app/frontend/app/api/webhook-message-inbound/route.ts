import { match, P } from 'ts-pattern';
import { getWebhookLogger } from '../logger';
import { getOrCreateUser, sendMessage } from '../utils';
import {
    InboundMessageBase,
    inboundMessageSchema,
} from './events';
import { kv } from '@vercel/kv';

const logger = getWebhookLogger('message-inbound');
logger.info('Loading Webhook Handler');

const ENDPOINT = process.env.ENDPOINT;

const messageAction = (conversationName: string, user: string) => {
    const ncco = [
        {
            action: 'message',
            conversation_name: `${conversationName}`,
            user: `${user}`,
            geo: 'us',
        },
    ];
    logger.info('message ncco: ', ncco);
    return ncco;
};
export const POST = async (req: Request) => {
    try {
        logger.info(`${req.method} Request received`);
        logger.debug({ req });
        const body = await req.json();
        logger.debug('Request body', body);
        const data = inboundMessageSchema.parse(body);
        const { name } = await getOrCreateUser(`${data.from}:${data.channel}`, {
            display_name: `${data.from} (${data.channel})`,
            image_url: `https://picsum.photos/seed/${data.from.slice(3, 5)}/200/200`,
        });
        // get conversation name 
        const conversationName = await kv.get<string>(`user:${name}:conversation:name`);
        return match({ ...data, name, conversationName: `${conversationName}` })
            .with(
                {
                    channel: P.union('messenger', 'sms'), text: P.when((text) => text.startsWith('CONNECT:'))
                },
                async (data) => {
                    logger.info(`Connent Message for ${data.from} on ${data.channel}`);
                    const conversationName = data.text.split(':')[1];
                    logger.info(`Conversation Name: ${conversationName}`);
                    await kv.set(`user:${data.name}:conversation:name`, conversationName);
                    return new Response(JSON.stringify(messageAction(conversationName, data.name)), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                })
            .with(
                { channel: P.union('messenger', 'sms'), conversationName: P.string }, 
                async ({ conversationName, name }) => {
                    return new Response(JSON.stringify(messageAction(conversationName, name)), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                })
            .otherwise(() => {
                logger.info('No match');
                return new Response('invalid channel', { status: 200 });
            });
    } catch (error) {
        logger.error('Error in inbound message', error);
    }
    return new Response('invalid channel', { status: 200 });
};
