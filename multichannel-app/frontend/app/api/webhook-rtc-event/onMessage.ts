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

export const onMessage = async (event: z.infer<typeof messageEvent>) => {
    logger.info('Event received');
    logger.debug({ event });
    match(event)
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@asr')),
            }
        }, (data) => {
            // handle asr
        })
        .with({
            body: {
                message_type: 'text',
                text: P.when((text) => text.startsWith('@bot')),
            }
        }, (data) => {
            // handle bot
        })
        .otherwise(() => { });
};
