import { z } from 'zod';
import { memberInvitedEvent } from './events.ts';

export const onMemberInvited = (event: z.infer<typeof memberInvitedEvent>) => {
  console.log('---- MEMBER INVITED ----');
};