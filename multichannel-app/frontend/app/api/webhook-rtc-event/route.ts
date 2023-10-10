// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import {
    conversationCreatedEvent,
    memberJoinedEvent,
    memberLeftEvent,
    memberMediaEvent,
    messageEvent,
    RTCEventBaseNoConv,
    rtcHangupEvent,
    appKnocking
} from './events';
import { onMemberMedia } from './onMemberMedia';
import { onRtcHangup } from './onRtcHangup';
import { onMessage } from './onMessage';
import { onConversationCreated } from './onConversationCreated';
import { onMemberJoined } from './onMemberJoined';
import { onMemberLeft } from './onMemberLeft';
import { onAppKnocking } from './onAppKnocking';
import { getWebhookLogger } from '../logger';

const logger = getWebhookLogger('rtc-event');
logger.info('Loading Webhook Handler');

export const POST = async (req: Request) => {
    logger.info(`${req.method} Request received rtc-event`);
    // return new Response(req.method, {
    //         headers: { 'Content-Type': 'application/json' },
    //         status: 200,
    //     });

    const data = await req.json();
    logger.debug('Request body ', data);
    try {
        const event = RTCEventBaseNoConv.parse(data);
        switch (event.type) {
            case 'member:media':
                onMemberMedia(memberMediaEvent.parse(event), req);
                break;
            case 'rtc:hangup':
                onRtcHangup(rtcHangupEvent.parse(event), req);
                break;
            case 'message':
                onMessage(messageEvent.parse(event));
                break;
            case 'conversation:created':
                onConversationCreated(conversationCreatedEvent.parse(event));
                break;
            case 'member:joined':
                onMemberJoined(memberJoinedEvent.parse(event));
                break;
            case 'member:left':
                onMemberLeft(memberLeftEvent.parse(event), req);
                break;
            case 'app:knocking':
                onAppKnocking(appKnocking.parse(event));
                break;
            default:
                logger.debug(
                    `Unknown event type: ${event.type}`,
                    event
                );
                break;
        }
    } catch (e) {
        logger.error('Error parsing event ' + data.type, e, data);
        return new Response(JSON.stringify(e), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};
