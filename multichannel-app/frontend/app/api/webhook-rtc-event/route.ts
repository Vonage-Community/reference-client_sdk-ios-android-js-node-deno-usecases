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
    appKnocking,
    audioPlayEvent,
    audioPlayStopEvent,
    audioPlayDoneEvent,
    audioSayEvent,
    audioSayStopEvent,
    audioSayDoneEvent,
    audioRecordEvent,
    audioRecordStopEvent,
    audioRecordDoneEvent,
    audioAsrDoneEvent,
    audioAsrRecordDoneEvent,
    audioTranscribeDoneEvent
} from './events';
import { onMemberMedia } from './onMemberMedia';
import { onRtcHangup } from './onRtcHangup';
import { onMessage } from './onMessage';
import { onConversationCreated } from './onConversationCreated';
import { onMemberJoined } from './onMemberJoined';
import { onMemberLeft } from './onMemberLeft';
import { onAppKnocking } from './onAppKnocking';
import { onAudioSay } from './onAudioSay';
import { onAudioSayStop } from './onAudioSayStop';
import { onAudioSayDone } from './onAudioSayDone';
import { onAudioPlay } from './onAudioPlay';
import { onAudioPlayStop } from './onAudioPlayStop';
import { onAudioPlayDone } from './onAudioPlayDone';
import { onAudioRecord } from './onAudioRecord';
import { onAudioRecordStop } from './onAudioRecordStop';
import { onAudioRecordDone } from './onAudioRecordDone';
import { onAudioAsrDone } from './onAudioAsrDone';
import { onAudioAsrRecordDone } from './onAudioAsrRecordDone';
import { onAudioTranscribeDone } from './onAudioTranscribeDone';
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
            case 'audio:say':
                onAudioSay(audioSayEvent.parse(event), req);
                break;
            case 'audio:say:stop':
                onAudioSayStop(audioSayStopEvent.parse(event), req);
                break;
            case 'audio:say:done':
                onAudioSayDone(audioSayDoneEvent.parse(event), req);
                break;
            case 'audio:play':
                onAudioPlay(audioPlayEvent.parse(event), req);
                break;
            case 'audio:play:stop':
                onAudioPlayStop(audioPlayStopEvent.parse(event), req);
                break;
            case 'audio:play:done':
                onAudioPlayDone(audioPlayDoneEvent.parse(event), req);
                break;
            case 'audio:record':
                onAudioRecord(audioRecordEvent.parse(event), req);
                break;
            case 'audio:record:stop':
                onAudioRecordStop(audioRecordStopEvent.parse(event), req);
                break;
            case 'audio:record:done':
                onAudioRecordDone(audioRecordDoneEvent.parse(event), req);
                break;
            case 'audio:asr:done':
                onAudioAsrDone(audioAsrDoneEvent.parse(event), req);
                break;
            case 'audio:asr:record:done':
                onAudioAsrRecordDone(audioAsrRecordDoneEvent.parse(event), req);
                break;
            case 'audio:transcribe:done':
                onAudioTranscribeDone(audioTranscribeDoneEvent.parse(event), req);
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
