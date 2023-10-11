import { z } from 'zod';
import { appKnocking } from './events';
import { getRTCLogger } from '../logger';
import { csClient } from '../utils';
const logger = getRTCLogger('onAppKnocking');

const ENDPOINT = process.env.ENDPOINT;
export const onAppKnocking = async (
    event: z.infer<typeof appKnocking>,
) => {
    logger.info('handling event: ' + event.type, { event });
    const userid = event.body.user?.id;
    const fromType = event.body.channel?.from?.type;
    const phoneNumber = event.body.channel?.from?.number;


    if (phoneNumber) {
        logger.debug(`modify display name ${userid} into ${phoneNumber}`);
        try {
            await csClient(`/users/${userid}`, 'PATCH', {
                name: `${phoneNumber}:${fromType}`,
                display_name: `${phoneNumber} (${fromType})`,
                image_url: `https://picsum.photos/seed/${phoneNumber.slice(3, 5)}/200/200`,
            });
        } catch (err) {
            logger.error('csClient error: ' + event.type, err);
        }
    }
};