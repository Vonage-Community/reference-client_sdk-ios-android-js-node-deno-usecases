import { MessageEvent } from './events';
import { csClient, getConversationName, sendMessage, startWithOrExact } from '../utils';
import { getRTCLogger } from '../logger';
import { match, P } from 'ts-pattern';
import { kv } from '@vercel/kv';
import { toogleAssistantBot } from '../ws-bot/assistant_bot';

const logger = getRTCLogger('message');

const isValidUrl = (url: string) => {
    try {
        return Boolean(new URL(url));
    }
    catch (e) {
        return false;
    }
};

const supportedImageTypes = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg+xml'
] as const;
/**
 * Checks if the text has a valid image url
 * if it does, it will return the url
 * @param text 
 * @returns url or undefined
 */
const getImageUrl = (text: string): string | undefined => {
    const regex = new RegExp(`(https?:\/\/.*\.(${supportedImageTypes.join('|')}))`, 'gi');
    const match = text.match(regex);
    return match?.[0];
};

const getUrl = (text: string): string | undefined => {
    const regex = new RegExp('(https?:\/\/.*)', 'gi');
    const match = text.match(regex);
    return match?.[0];
};


export const startCommands = [
    '@tts',
    '@stream',
    '@record',
    '@transcribe',
    '@asr',
    '@push',
    '@invite'
] as const;

export const stopCommands = [
    '@tts-stop',
    '@stream-stop',
    '@record-stop',
    '@transcribe-stop',
    '@asr-stop'
] as const;

export const commands = [
    ...startCommands,
    ...stopCommands
] as const;

type Command = typeof commands[number];

export const isCommand = <T extends Command>(command: T) => (text: string,): text is `${T} ${string}` => text.startsWith(`${command}`);


export const onMessage = async (event: MessageEvent) => {
    logger.info('Event received');
    logger.debug({ event });

    const conversationId = event.cid ?? event.conversation_id;

    match(event)
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@tts-stop')),
            }
        }, async () => {
            logger.info('tts stopped');
            let ttsId;

            try {
                ttsId = await kv.get<string>(`conversation:${conversationId}:tts`);

                if (ttsId && conversationId) {
                    const reqBody = {
                        type: 'audio:say:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            say_id: ttsId
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('tts stop error: ' + ttsId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@tts')),
            }
        }, async (evt) => {
            logger.info('tts started');
            const tts = evt.body.text?.split(' ')?.splice(1)?.join(' ');

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
                text: P.when(isCommand('@stream-stop')),
            }
        }, async () => {
            logger.info('stream stopped');
            let streamId;

            try {
                streamId = await kv.get<string>(`conversation:${conversationId}:stream`);

                if (streamId && conversationId) {
                    const reqBody = {
                        type: 'audio:play:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            play_id: streamId,
                        },
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('stream stop error: ' + streamId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@stream')),
            }
        }, async (evt) => {
            logger.info('stream started');
            const streamUrl = evt.body.text?.split(' ')?.[1];

            if (streamUrl && conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:play',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            stream_url: [streamUrl],
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
                text: P.when(isCommand('@record-stop')),
            }
        }, async () => {
            logger.info('recording stopped');
            let recordingId;

            try {
                recordingId = await kv.get<string>(`conversation:${conversationId}:record`);

                if (recordingId && conversationId) {
                    const reqBody = {
                        type: 'audio:record:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            record_id: recordingId
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('recording stop error: ' + recordingId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@record')),
            }
        }, async () => {
            logger.info('recording started');

            if (conversationId) {
                try {
                    const reqBody = {
                        type: 'audio:record',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            multitrack: true,
                            beep_start: true,
                            beep_stop: true,
                        }
                    };
                    logger.info('recording body', reqBody);
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                } catch (err) {
                    logger.error('recording error', err);
                }
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@transcribe-stop')),
            }
        }, async () => {
            logger.info('transcription stopped');
            let recordingId;

            try {
                recordingId = await kv.get<string>(`conversation:${conversationId}:transcribe`);

                if (recordingId && conversationId) {
                    const reqBody = {
                        type: 'audio:record:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            record_id: recordingId
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('transcription stop error: ' + recordingId, err);
            }
        }).with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@transcribe-stop')),
            }
        }, async () => {
            logger.info('transcription stopped');
            let recordingId;

            try {
                recordingId = await kv.get<string>(`conversation:${conversationId}:transcribe`);

                if (recordingId && conversationId) {
                    const reqBody = {
                        type: 'audio:record:stop',
                        ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
                        body: {
                            record_id: recordingId
                        }
                    };
                    await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('transcription stop error: ' + recordingId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@transcribe')),
            }
        }, async () => {
            logger.info('transcription started');

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
                text: P.when(isCommand('@invite')),
            }
        }, async (evt) => {
            const [_, type, value] = evt.body.text.toLowerCase().split(' ') ?? [];
            if (type != 'app' && type != 'phone') return;
            if (!value) return;

            const { name } = await csClient(`/conversations/${conversationId}`);

            const to = match([type, value])
                .with(['app', P.not(undefined)], ([type, value]) => ({
                    type: 'app',
                    user: value
                }))
                .with(['phone', P.not(undefined)], ([type, value]) => ({
                    type: 'phone',
                    number: value
                }))
                .otherwise(() => undefined);
            await csClient('/calls', 'POST', {
                to: [to],
                ncco: [
                    {
                        action: 'conversation',
                        name: name
                    }
                ]
            }, 'v2');
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@asr-stop')),
            }
        }, async (evt) => {
            logger.info('asr stopped');
            let legId;

            try {
                const userName = evt.body.text?.split(' ')?.[1];
                legId = await kv.get<string>(`user:${userName}:conversation:${conversationId}`);

                if (legId) {
                    await csClient(`/legs/${legId}/asr`, 'DELETE');
                }
            } catch (err) {
                logger.error('asr stop error: ' + legId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@asr')),
            }
        }, async (evt) => {
            logger.info('asr started');
            let legId;

            try {
                const userName = evt.body.text?.split(' ')?.[1];
                legId = await kv.get<string>(`user:${userName}:conversation:${conversationId}`);

                if (legId && conversationId) {
                    const reqBody = {
                        language: 'en-US',
                        speech_context: ['a', 'b'],
                        conversation_id: conversationId,
                        end_on_silence_timeout: 5,
                        active: true,
                        sensitivity: 90
                    };
                    await csClient(`/legs/${legId}/asr`, 'POST', reqBody);
                }
            } catch (err) {
                logger.error('asr error: ' + legId, err);
            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when(isCommand('@push')),
            }
        }, async (evt) => {
            logger.info('push notification sent');
            if (!conversationId) return;
            const userIdOrName = evt.body.text?.split(' ')?.[1];
            const text = evt.body.text?.split(' ')?.splice(2)?.join(' ');

            if (userIdOrName && text) {
                try {
                    const reqBody = {
                        title: 'Custom Push Notification',
                        body: text
                    };
                    await csClient(`/users/${userIdOrName}/notifications`, 'POST', reqBody);
                    await csClient(`/conversations/${conversationId}/members`, 'POST', {
                        state: 'joined',
                        user: {
                            name: userIdOrName
                        },
                        channel: {
                            type: 'app'
                        }
                    });

                    sendMessage(conversationId, {
                        type: 'message',
                        body: {
                            message_type: 'text',
                            text: `push notification sent to ${userIdOrName} with text: ${text}`
                        }
                    });

                } catch (err) {
                    logger.error('push notification error: ' + userIdOrName, err);
                }


            }
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => startWithOrExact(text as string, '@assistant'))
            }
        }, async (evt) => {
            const convid = event.conversation_id as string;
            const convName = await getConversationName(convid);

            const toogleRes = await toogleAssistantBot(convName);
            const messageString = toogleRes.enabled ? 'assistant bot enabled, make your questions' : 'assistant bot disabled';

            await sendMessage(convid, {
                type: 'message',
                body: {
                    message_type: 'text',
                    text: messageString
                }
            });
        })
        // .with({
        //     body: {
        //         message_type: 'text',
        //         text: P.when((text) => getImageUrl(text as string)),
        //     }
        // }, async ({ body: { text } }) => {
        //     // do something with images
        //     logger.info('image received');
        //     const imageUrl = getImageUrl(text);

        //     const reqBody = {
        //         type: 'message',
        //         ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
        //         body: {
        //             message_type: 'image',
        //             image: { url: imageUrl }
        //         }
        //     };
        //     await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
        // })
        // .with({
        //     body: {
        //         message_type: 'text',
        //         text: P.when((text) => getUrl(text as string)),
        //     }
        // }, async ({ body: { text } }) => {
        //     // do something with urls
        //     logger.info('url received');
        //     const url = getUrl(text);

        //     const reqBody = {
        //         type: 'custom:link',
        //         ...(event?._embedded?.from_member?.id && { from: event._embedded.from_member.id }),
        //         body: {
        //             url: url
        //         }
        //     };
        //     await csClient(`/conversations/${conversationId}/events`, 'POST', reqBody);
        // })
        .otherwise((data) => {
            logger.info('No action taken', data);
        });
};
