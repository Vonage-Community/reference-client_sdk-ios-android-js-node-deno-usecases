// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { UserClient, AdminClient } from '../supabaseClient.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';
import { corsHeaders } from '../cors.ts';
import { NewDeviceSchema, newDevice } from './newDevice.ts';
import { NewCodeSchema, newCode } from './newDeviceCode.ts';
import { RefreshSchema, refreshToken } from './tokenRefresh.ts';
import { LoginSchema, codeLogin } from './login.ts';
import { updatePresence, updatePresenceSchema } from './logout.ts';



const deviceSchema = z.discriminatedUnion('type', [NewDeviceSchema, NewCodeSchema, LoginSchema, RefreshSchema, updatePresenceSchema]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const data = await deviceSchema.parseAsync(body);
    switch (data.type) {
      case 'new_device':
        return await newDevice(UserClient(req), data);
      case 'new_code':
        return await newCode(UserClient(req), data);
      case 'login':
        return await codeLogin(AdminClient(req), data);
      case 'refresh':
        return await refreshToken(AdminClient(req), data);
      case 'update_presence':
        return await updatePresence(AdminClient(req), data);
      default:
        return new Response(JSON.stringify({ error: 'Type not implemented' }), { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } });
    }
  } catch (e) {
    console.error(e);

    if (e instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: e.issues }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } });
    }

    if (e instanceof Error) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }

});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
