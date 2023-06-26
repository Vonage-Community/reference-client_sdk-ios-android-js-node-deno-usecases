// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { eventSchema, postbackSchema, postbackPayloadSchema } from './events.ts';
import { addUserToConversation, conversationHasAgents, sendBotTextMessage } from '../utils.ts';
import { AdminClient } from '../supabaseClient.ts';
import { z } from 'zod';

const VERIFY_TOKEN = Deno.env.get('VERIFY_TOKEN') || '';

const ChallengeSchema = z.object({
  'hub.challenge': z.string(),
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.literal(VERIFY_TOKEN),
});

const challenge = async (searchParams: URLSearchParams) => {
  console.log(searchParams);
  try {
    console.log(VERIFY_TOKEN, 'challange received');
    const data = await ChallengeSchema.parseAsync(Object.fromEntries(searchParams));
    console.log(VERIFY_TOKEN, 'challange received', data);
    console.log('Challenge is verified');
    return new Response(data['hub.challenge'], { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Invalid challenge', { status: 403 });
  }
};

const processAction = async (payload: z.infer<typeof postbackPayloadSchema>, adminClient: ReturnType<typeof AdminClient>) => {
  switch (payload.action) {
    case 'connect': {
      console.log(`postback action connect is received ${payload}`);
      await actionConnect(payload.cid, adminClient);
      break;
    }
    case 'none': {
      console.log(`post back action none is received ${payload}`);
      await actionNone(payload.cid);
      break;
    }
    default:
      return new Response('Invalid action', { status: 405 });
  }
  return new Response('postback', { status: 200 });
};

const actionNone = async (cid: string) => {
  return await sendBotTextMessage(cid, 'Thanks for contacting us.');
};

const actionConnect = async (cid: string, adminClient: ReturnType<typeof AdminClient>) => {
  try {
    const hasAgents = await conversationHasAgents(cid);
    if (hasAgents) return;
    // Find the first available agent and mark it as BUSY
    const { data, error } = await adminClient.from('user_available_view_voice').select('*').limit(1).maybeSingle();
    if (!data || error) {
      console.log('Error in fetching agent from supabase', error, data);
      return await sendBotTextMessage(cid, 'All our agents are busy at the moment. Please try again in a while');
    }
    console.log('new availablity data', data);
    const { error: err } = await adminClient.rpc('set_user_presence_email', {
      user_email: data.email!, new_availability: data.availability!, new_status: 'BUSY'
    });
    if (err) {
      console.log('Error in setting user busy', err);
      return;
    }
    await addUserToConversation(cid, data.email);
  } catch (error) {
    console.log('Error in fetching agent from supabase in catch block', error);
  }
};

serve(async (req) => {
  try {
    switch (req.method) {
      case 'GET':
        return await challenge(new URL(req.url).searchParams);
      case 'POST': {
        const adminCleint = await AdminClient(req);
        const json = await req.json();
        const postbackData = eventSchema.parse(json).entry[0].messaging[0];
        const data = postbackSchema.parse(postbackData);
        const payload = data.postback.payload;
        return await processAction(payload, adminCleint);
      }
      default:
        return new Response('Invalid method', { status: 405 });
    }
  } catch (error) {
    console.log(`Error in facebook-webhook-callback ${error}`);
    return new Response(JSON.stringify({
      error: error.message,
    }), { status: 500 });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'