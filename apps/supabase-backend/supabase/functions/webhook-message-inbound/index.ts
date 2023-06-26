// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';

const messageAction = (data: z.infer<typeof inboundMessageSchema>) => 
  [
    {
      action: 'message',
      conversation_name: `${data.channel}:conversation:${data.from}`,
      user: `${data.channel}:customer:${data.from}`,
      geo: 'us-2'
    }
  ];

const inboundMessageSchema = z.object({
  to: z.string(),
  from:z.string(),
  channel: z.string(),
  message_uuid: z.string(),
  timestamp: z.string(),
  message_type: z.string(), // it image, text
  text: z.string() 
  });

serve(async (req) => {
  console.log('---- INBOUND MESSAGE ----');
  const body = await req.json();
  const data = inboundMessageSchema.parse(body);
  switch (data.channel) {
    case 'messenger':
      return new Response(JSON.stringify(messageAction(data)), { status: 200, headers: { 'Content-Type': 'application/json'} });
    default: 
      return new Response('invalid channel', { status: 400});
  }
});