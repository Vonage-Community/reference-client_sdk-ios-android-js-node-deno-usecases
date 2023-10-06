// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
    eventSchema,
    postbackPayloadSchema,
    postbackSchema,
} from './events.ts';

import { z } from 'zod';
import { getWebhookLogger } from '../logger.ts';
import { actionConnect, actionNone } from '../chatActions.ts';

const logger = getWebhookLogger('facebook');
logger.info('Loading Webhook Handler');

const VERIFY_TOKEN = Deno.env.get('VERIFY_TOKEN') || '';

const ChallengeSchema = z.object({
    'hub.challenge': z.string(),
    'hub.mode': z.literal('subscribe'),
    'hub.verify_token': z.literal(VERIFY_TOKEN),
});

const challenge = async (searchParams: URLSearchParams) => {
    try {
        logger.debug('Challenge received');
        const data = await ChallengeSchema.parseAsync(
            Object.fromEntries(searchParams),
        );
        logger.debug('Challenge is verified');
        return new Response(data['hub.challenge'], { status: 200 });
    } catch (error) {
        logger.error('Challenge is not verified', error);
        return new Response('Invalid challenge', { status: 403 });
    }
};

const processAction = async (
    payload: z.infer<typeof postbackPayloadSchema>,
) => {
    switch (payload.action) {
        case 'connect': {
            logger.debug(`post back action connect is received ${payload}`);
            await actionConnect(payload.cid, 'messenger');
            break;
        }
        case 'none': {
            logger.debug(`post back action none is received ${payload}`);
            await actionNone(payload.cid, 'messenger');
            break;
        }
        default:
            logger.debug(`post back action unknown is received ${payload}`);
            return new Response('Invalid action', { status: 200 });
    }
    return new Response('postback', { status: 200 });
};

serve(async (req) => {
    logger.info(`${req.method} Request received`);
    logger.debug({ req });
    try {
        switch (req.method) {
            case 'GET':
                return await challenge(new URL(req.url).searchParams);
            case 'POST': {
                const json = await req.json();
                const postbackData =
                    eventSchema.parse(json).entry[0].messaging[0];
                const data = postbackSchema.parse(postbackData);
                const payload = data.postback.payload;
                return await processAction(payload);
            }
            default:
                logger.error('Invalid method');
                return new Response('Invalid method', { status: 200 });
        }
    } catch (error) {
        logger.error('Error in processing request', error);
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            { status: 200 },
        );
    }
});
