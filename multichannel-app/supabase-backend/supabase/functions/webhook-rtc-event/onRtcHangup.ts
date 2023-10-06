import { z } from 'zod';
import { rtcHangupEvent } from './events.ts';
import { AdminClient } from '../supabaseClient.ts';
import { getRTCLogger } from '../logger.ts';

const logger = getRTCLogger('rtc:hangup');

export const onRtcHangup = async (
    event: z.infer<typeof rtcHangupEvent>,
    _req: Request,
) => {
    logger.info('Event received');
    logger.debug({ event });

    logger.debug('Fetching user profile');
    const { data: userData, error } = await AdminClient().from(
        'user_profile',
    )
        .select('user_id').eq('username', event._embedded?.from_user?.name)
        .maybeSingle();
    if (error) throw error;
    if (!userData) throw new Error('User not found');

    // update user presence
    logger.debug('Updating user presence');
    const { error: presenceError } = await AdminClient().from(
        'user_presence',
    )
        .update({ status: 'AVAILABLE', actitivy: 'IDLE' }).eq(
            'user_id',
            userData.user_id,
        );

    if (presenceError) {
        logger.error(presenceError);
        throw presenceError;
    }
};
