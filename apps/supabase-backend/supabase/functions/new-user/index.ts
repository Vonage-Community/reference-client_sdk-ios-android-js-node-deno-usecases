// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ZodError } from 'zod';
import { mintVonageToken } from '../token.ts';
import { userSchema } from '../vonageUser.ts';
import { SupabaseUserDeleteWebhook, SupabaseUserInsertWebhook, SupabaseUserWebhookSchema } from '../supabaseDBHookEvents.ts';
import { AdminClient } from '../supabaseClient.ts';

console.log('Hello from Functions!');


serve(async (req) => {
  const body = await req.json();
  const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY');
  const applicationId = Deno.env.get('VONAGE_APPLICATION_ID');

  if (!privateKey || !applicationId) {
    throw new Error('Missing VONAGE_PRIVATE_KEY or VONAGE_APPLICATION_ID');
  }

  const token = await mintVonageToken(privateKey, applicationId);

  const supabaseClient = AdminClient(req);

  try {
    const webhook = SupabaseUserWebhookSchema.parse(body);

    switch (webhook.type) {
      case 'INSERT':
        return await createVonageUser(webhook);
      case 'DELETE':
        return await deleteVonageUser(webhook);
      default:
        // Not implemented
        return new Response(JSON.stringify({}), { status: 205 });
    }
  } catch (e) {
    if (e instanceof ZodError) {
      console.error(e);
      const error = {
        code: 'invalid_webhook',
        description: 'The webhook was invalid',
        error: e.issues,
      };
      return new Response(JSON.stringify(error), { status: 400 });
    }
    console.error(e);

    return new Response(JSON.stringify({
      code: 'internal_server_error',
      description: 'Something went wrong',
      error: e.message

    }), { status: 500 });
  }

  async function createVonageUser(webhook: SupabaseUserInsertWebhook) {
    const response = await fetch('https://api.nexmo.com/v0.3/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: webhook.record.email,
        display_name: webhook.record.raw_user_meta_data?.name,
        image_url: webhook.record.raw_user_meta_data?.avatar_url,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const user = userSchema.parse(data);

    const { error } = await supabaseClient.auth.admin.updateUserById(webhook.record.id, {
      user_metadata: {
        vonage_user_id: user.id,
      },
    });

    if (error) throw error;
    return new Response(JSON.stringify(user), { status: 200 });
  }

  async function deleteVonageUser(webhook: SupabaseUserDeleteWebhook) {
    const vonage_user_id = webhook.old_record.raw_user_meta_data?.vonage_user_id;
    if (!vonage_user_id) {
      throw new Error('Missing vonage_user_id');
    }

    const response = await fetch(`https://api.nexmo.com/v0.3/users/${vonage_user_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return new Response(JSON.stringify({}), { status: 200 });
  }

});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
