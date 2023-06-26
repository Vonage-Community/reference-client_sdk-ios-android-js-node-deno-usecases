import { z } from 'zod';
import { rtcHangupEvent } from './events.ts';
import { AdminClient } from '../supabaseClient.ts';

export const onRtcHangup = async (
    event: z.infer<typeof rtcHangupEvent>,
    req: Request,
  ) => {
    const { data: userData, error } = await AdminClient(req).from('user_profile')
      .select('user_id').eq('username', event._embedded?.from_user?.name)
      .maybeSingle();
    if (error) throw error;
    if (!userData) throw new Error('User not found'); 
  
    // update user presence
    const { error: presenceError } = await AdminClient(req).from('user_presence')
      .update({ status: 'AVAILABLE', actitivy: 'IDLE' }).eq(
        'user_id',
        userData.user_id,
      );
  
    if (presenceError) {
      console.error(presenceError);
      throw presenceError;
    }
  };