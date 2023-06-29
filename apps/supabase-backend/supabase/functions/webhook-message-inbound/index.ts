// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { csClient } from '../utils.ts';
import { getWebhookLogger } from '../logger.ts';
import { actionConnect, actionNone } from '../chatActions.ts';
import {
    InboundFacebookMessage,
    InboundMessage,
    InboundMessageBase,
    inboundMessageSchema,
    inboundWhatsAppScema,
    WhatsappBase,
} from './events.ts';

const logger = getWebhookLogger('message-inbound');
logger.info('Loading Webhook Handler');

const messageAction = (data: InboundMessageBase) => [
    {
        action: 'message',
        conversation_name: `${data.channel}:conversation:${data.from}`,
        user: `${data.channel}:customer:${data.from}`,
        geo: 'us-2',
    },
];

const getMessengerUser = async (messengerId: string) => {
    logger.debug(`Get Messenger User`);
    const FACEBOOK_PAGE_ACCESS_TOKEN =
        Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') ?? '';
    const facebookResponse = await fetch(
        `https://graph.facebook.com/${messengerId}?fields=name,profile_pic&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`,
    );
    if (!facebookResponse.ok) {
        logger.error(
            `Error getting Messenger User details for ${messengerId}`,
            facebookResponse,
        );
        return;
    }
    const userObject = await facebookResponse.json();
    return userObject;
};

const createCustomerUser = async (
    data: InboundMessage,
) => {
    logger.debug('Checking if Customer User exists');
    const customerUsername = `${data.channel}:customer:${data.from}`;
    try {
        await csClient(`/users/${customerUsername}`);
        logger.debug('Customer User already exists');
        return;
    } catch (error) {
        if (!error.message.includes('404')) {
            logger.error('Error checking if Customer User exists:', error);
            throw error;
        }
    }

    logger.debug('Customer User does not exist, creating');

    switch (data.channel) {
        case 'messenger':
            return await createFacebookUser(data, customerUsername);
        case 'whatsapp':
            return await createWhatsappUser(data, customerUsername);
    }
};

const createWhatsappUser = async (
    data: WhatsappBase,
    customerUsername: string,
) => {
    logger.debug('Creating Whatsapp user');
    try {
        const customerDisplayName = data.profile?.name || customerUsername;
        await csClient(`/users`, 'POST', {
            name: customerUsername,
            display_name: customerDisplayName,
        });
        logger.debug('Whatsapp Customer User created');
    } catch (error) {
        logger.error('Error creating Whatsapp User:', error);
        throw error;
    }
};

const createFacebookUser = async (
    data: InboundFacebookMessage,
    customerUsername: string,
) => {
    logger.debug('Creating Facebook user');
    try {
        const messengerUser = await getMessengerUser(data.from);
        const customerDisplayName = messengerUser?.name;
        const customerImageUrl = messengerUser?.profile_pic;
        await csClient(`/users`, 'POST', {
            name: customerUsername,
            display_name: customerDisplayName || customerUsername,
            image_url: customerImageUrl,
        });
        logger.debug('Facebook User created');
    } catch (error) {
        logger.error('Error creating Facebook User:', error);
        throw error;
    }
};

const processWhatsappMessage = async (data: InboundMessageBase) => {
    const whatsappData = inboundWhatsAppScema.parse(data);
    try {
        switch (whatsappData.message_type) {
            case 'reply':
                {
                    const [type, cid] = whatsappData.reply.id.split(':');
                    switch (type) {
                        case 'connect-agent':
                            await actionConnect(cid, 'whatsapp');
                            break;
                        case 'none':
                            await actionNone(cid, 'whatsapp');
                            break;
                        default:
                            break;
                    }
                }
                break;
            case 'text':
                return new Response(JSON.stringify(messageAction(data)), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            default:
                logger.info('invalid channel');
        }
    } catch (error) {
        logger.error('Error processing whatapp message', error);
    }
    return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};

serve(async (req) => {
    try {
        logger.info(`${req.method} Request received`);
        logger.debug({ req });
        const body = await req.json();
        logger.debug('Request body', body);
        const data = inboundMessageSchema.parse(body);
        await createCustomerUser(data);
        switch (data.channel) {
            case 'sms':
            case 'messenger':
                logger.info(`${data.channel} Channel`);
                return new Response(JSON.stringify(messageAction(data)), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            case 'whatsapp':
                return await processWhatsappMessage(data);
            default:
                logger.info('invalid channel');
        }
    } catch (error) {
        logger.error('Error in inbound message', error);
    }
    return new Response('invalid channel', { status: 200 });
});
