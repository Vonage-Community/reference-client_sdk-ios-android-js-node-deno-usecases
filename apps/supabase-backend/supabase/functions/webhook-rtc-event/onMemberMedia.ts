import { z } from 'zod';
import { memberMediaEvent } from './events.ts';
import { AdminClient } from '../supabaseClient.ts';
import { getRTCLogger } from '../logger.ts';

const logger = getRTCLogger('member-media');

export const onMemberMedia = async (
    event: z.infer<typeof memberMediaEvent>,
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
    if (!userData) {
        logger.error('User not found');
        throw new Error('User not found');
    }
    if (!event.body?.media.audio) {
        logger.debug('No audio in media, ignoring');
        return;
    }

    logger.debug('Updating user profile');
    // update user presence
    const { error: presenceError } = await AdminClient().from(
        'user_presence',
    )
        .update({ status: 'BUSY', actitivy: 'IN-CALL' }).eq(
            'user_id',
            userData.user_id,
        );

    if (presenceError) {
        logger.error('Error updating user presence', presenceError);
        throw presenceError;
    }
};
