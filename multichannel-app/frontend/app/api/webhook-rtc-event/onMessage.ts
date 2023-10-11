import { z } from 'zod';
import { messageEvent } from './events';
import { csClient } from '../utils';
import { getRTCLogger } from '../logger';
import { match, P } from 'ts-pattern';

// import {
//     actionConnect,
//     actionStop,
//     sendBotTextMessage,
//     sendFacebookActionMessage,
//     sendSMSActionMessage,
//     sendWhatsappActionMessage,
// } from '../chatActions';

const logger = getRTCLogger('message');

const isValidUrl = (url: string) => {
      try { 
      	return Boolean(new URL(url)); 
      }
      catch(e){ 
      	return false; 
      }
};

export const onMessage = async (event: z.infer<typeof messageEvent>) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;

    match(event)
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@tts')),
            }
        }, async () => {
            const tts = event.body.text?.split(' ')?.splice(1)?.join(' ');

            if (tts && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:say',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            text: tts,
                            voice_name: 'Amy',
                            level: 1,
                            queue: true,
                            loop: 1,
                            ssml: false
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('tts error: ' + tts, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@tts-stop')),
            }
        }, async () => {
            const ttsId = event.body.text?.split(' ')?.[1];

            if (ttsId && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:say:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            say_id: ttsId
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('tts stop error: ' + ttsId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@stream')),
            }
        }, async () => {
            const streamUrl = event.body.text?.split(' ')?.[1];
            
            if (streamUrl && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:play',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            stream_url: streamUrl,
                            level: 1,
                            loop: 1
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('stream error: ' + streamUrl, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@stream-stop')),
            }
        }, async () => {
            const streamId = event.body.text?.split(' ')?.[1];
            
            if (streamId && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:play:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            play_id: streamId,
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('stream stop error: ' + streamId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@record')),
            }
        }, async () => {
            if (conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:record',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id })
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('recording error', err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@record-stop')),
            }
        }, async () => {
            const recordingId = event.body.text?.split(' ')?.[1];

            if (recordingId && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:record:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            record_id: recordingId
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('recording stop error: ' + recordingId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text: string) => text.startsWith('@transcribe')),
            }
        }, async () => {
            if (conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:record',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            transcription: {
                                language: 'en-US',
                                sentiment_analysis: true
                            }
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('transcription error', err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text: string) => text.startsWith('@transcribe-stop')),
            }
        }, async () => {
            const recordingId = event.body.text?.split(' ')?.[1];

            if (recordingId && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:record:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            record_id: recordingId
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('transcription stop error: ' + recordingId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@asr')),
            }
        }, async () => {
            const legId = event.body.text?.split(' ')?.[1];

            if (legId && conversationId) {
                try {
                    const reqBody = {
                        language: 'en-US',
                        speech_context: ['a', 'b'],
                        conversation_id: conversationId,
                        end_on_silence_timeout: 5,
                        active: true,
                        sensitivity: 90
                    };
                    await csClient(`/legs/${legId}/asr`, 'POST', reqBody);
                } catch (err) {
                    logger.error('asr error: ' + legId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@asr-stop')),
            }
        }, async () => {
            const legId = event.body.text?.split(' ')?.[1];

            if (legId) {
                try {
                    await csClient(`/legs/${legId}/asr`, 'DELETE');
                } catch (err) {
                    logger.error('asr stop error: ' + legId, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@push')),
            }
        }, async () => {
            const userIdOrName = event.body.text?.split(' ')?.[1];
            const text = event.body.text?.split(' ')?.[2];

            if (userIdOrName && text) {
                try {
                    const reqBody = {
                        title: 'Custom Push Notification',
                        body: text
                    };
                    await csClient(`/users/${userIdOrName}/notifications`, 'POST', reqBody);
                } catch (err) {
                    logger.error('push notification error: ' + userIdOrName, err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => isValidUrl(text)),
            }
        }, async () => {
            // do something with images
        });

    // // check if conversation is messanger
    // // verify if the chat has an agent or not
    // // if not send action message again
    // const cid = event.cid || event.conversation_id || '';

    // try {
    //     const conversation = await csClient(`/conversations/${cid}`, 'GET');
    //     const prefix = conversation.name.split(':')[0];
    //     const sender = event._embedded?.from_user?.name || '';
    //     logger.info('Checking if sender is a customer');
    //     if (!isCustomer(sender)) return;
    //     if (
    //         event.body.text == 'STOP' &&
    //         (prefix == 'sms' || prefix == 'viber_service')
    //     ) {
    //         const userId = event._embedded?.from_user?.id || '';
    //         await actionStop(cid, userId);
    //         return;
    //     }
    //     logger.debug('Checking if conversation has agents');
    //     const hasAgents = await conversationHasAgents(cid);
    //     if (hasAgents) return;
    //     logger.debug('No agents in conversation');
    //     switch (prefix) {
    //         case 'messenger':
    //             await sendFacebookActionMessage(cid);
    //             break;
    //         case 'whatsapp':
    //             await sendWhatsappActionMessage(cid);
    //             break;
    //         case 'viber_service':
    //         case 'sms':
    //             logger.info(`Sending Message for channel: ${prefix}`);
    //             if (event.body.text == 'CONNECT') {
    //                 await actionConnect(cid, prefix);
    //             } else {
    //                 await sendSMSActionMessage(cid);
    //             }
    //             break;
    //         case 'viber_service':
    //             // change later for viber, this is for test
    //             await sendBotTextMessage(
    //                 cid,
    //                 'Hi, welocme to Mehboob\'s Corner, how can we help you?',
    //             );
    //             break;
    //         default:
    //             logger.warning('Unsupported Channel');
    //             break;
    //     }
    // } catch (error) {
    //     logger.error('Error', error);
    // }
};
