import { z } from 'zod';
import { memberMediaEvent } from './events.ts';
import { AdminClient } from '../supabaseClient.ts';

export const onMemberMedia = async (
    event: z.infer<typeof memberMediaEvent>,
    req: Request,
  ) => {
    const { data: userData, error } = await AdminClient(req).from('user_profile')
      .select('user_id').eq('username', event._embedded?.from_user?.name)
      .maybeSingle();
  
    if (error) throw error;
    if (!userData) throw new Error('User not found');
    if (!event.body?.media.audio) {
       console.log('Audio not enabled');
       return;
    }
  
    // update user presence
    const { error: presenceError } = await AdminClient(req).from('user_presence')
      .update({ status: 'BUSY', actitivy: 'IN-CALL' }).eq(
        'user_id',
        userData.user_id,
      );
  
    if (presenceError) {
      console.error(presenceError);
      throw presenceError;
    }
  };