import { getWebhookLogger } from '../logger';
import {
    InboundMessageBase,
    inboundMessageSchema,
} from './events';

const logger = getWebhookLogger('message-inbound');
logger.info('Loading Webhook Handler');

const messageAction = (data: InboundMessageBase) => {
    const convname = data.text?.split(' ')[0];
    const ncco = [
        {
            action: 'message',
            conversation_name: `${convname}`,
            user: `${data.from} (${data.channel})`,
            geo: 'us-2',
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
        switch (data.channel) {
            case 'sms':
            case 'viber_service':
            case 'messenger':
                logger.info(`${data.channel} Channel`);
                return new Response(JSON.stringify(messageAction(data)), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            default:
                logger.info('invalid channel');
        }
    } catch (error) {
        logger.error('Error in inbound message', error);
    }
    return new Response('invalid channel', { status: 200 });
};
