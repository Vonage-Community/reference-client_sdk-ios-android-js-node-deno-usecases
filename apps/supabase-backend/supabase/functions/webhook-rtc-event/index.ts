// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { RTCEventBase, conversationCreatedEvent, memberJoinedEvent, memberLeftEvent, memberMediaEvent, messageEvent, rtcHangupEvent } from './events.ts';
import { onMemberMedia } from './onMemberMedia.ts';
import { onRtcHangup } from './onRtcHangup.ts';
import { onMessage } from './onMessage.ts';
import { onConversationCreated } from './onConversationCreated.ts';
import { onMemberJoined } from './onMemberJoined.ts';
import { onMemberLeft } from './onMemberLeft.ts';

serve(async (req) => {
  // console.log('----- RTC EVENT WEBHOOK ------');
  const data = await req.json();
  try {
    const event = RTCEventBase.parse(data);
    switch (event.type) {
      case 'member:media':
        onMemberMedia(memberMediaEvent.parse(event), req);
        break;
      case 'rtc:hangup':
        onRtcHangup(rtcHangupEvent.parse(event), req);
        break;
      case 'message':
        onMessage(messageEvent.parse(event));
        break;
      case 'conversation:created':
        onConversationCreated(conversationCreatedEvent.parse(event));
        break;
      case 'member:joined':
        onMemberJoined(memberJoinedEvent.parse(event));
        break;
      case 'member:left':
        onMemberLeft(memberLeftEvent.parse(event), req);
        break;
      default:
        console.log(`Unsupported event received: ${JSON.stringify(event, null, 3)}`);
    }
  } catch (e) {
    console.log('Json received', data, 'error in parsing', e);
    return new Response(JSON.stringify(e), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{'name':'Functions'}'
