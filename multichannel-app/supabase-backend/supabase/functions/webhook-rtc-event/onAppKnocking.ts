import { z } from 'zod';
import { appKnocking } from './events.ts';
// import { conversationCreatedEvent } from './events.ts';

import { getRTCLogger } from '../logger.ts';
import { csClient } from '../utils.ts';
const logger = getRTCLogger('onAppKnocking');
export const onAppKnocking = async (
    event: z.infer<typeof appKnocking>,
) => {
    logger.info('handling event: '+ event.type, { event });
    let userid = event.body.user?.id
    let fromType = event.body.channel?.from?.type
    let phoneNumber = event.body.channel?.from?.number
    if(phoneNumber){
        logger.debug(`modify display name ${userid} into ${phoneNumber}` )
        try {
            await csClient(`/users/${userid}`, 'PATCH', {
                display_name: phoneNumber        
            })
        }catch (err){
            logger.error('csClient error: '+ event.type, err);
        }
    }
};