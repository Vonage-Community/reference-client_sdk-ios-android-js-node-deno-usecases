// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';
import { AdminClient } from '../supabaseClient.ts';

const VONAGE_LVN = Deno.env.get('VONAGE_LVN') ?? '';

const zodJson = <T extends z.ZodTypeAny>(scheme: T) =>
    z.string().transform((value) => JSON.parse(value)).pipe(scheme);
const customDataSchema = zodJson(z.object({
    callType: z.enum(['app', 'phone']),
    callee: z.string(),
}));

const VoiceAnswerSchema = z.object({
    kind: z.enum(['server_call', 'inbound_call']),
    from: z.void(),
    custom_data: customDataSchema.optional(),
});

const ServerCallSchema = VoiceAnswerSchema.extend({
    kind: z.void().transform(() => 'server_call').pipe(
        z.literal('server_call'),
    ),
    custom_data: customDataSchema,
});

const InboundCallSchema = VoiceAnswerSchema.extend({
    kind: z.void().transform(() => 'inbound_call').pipe(
        z.literal('inbound_call'),
    ),
    from: z.string(),
    to: z.string(),
    custom_data: z.void(),
});

const schema = z.union([ServerCallSchema, InboundCallSchema]);

console.log('Hello from Functions!');

const handleServerCall = (
    _req: Request,
    { custom_data }: z.infer<typeof ServerCallSchema>,
) => {
    const connectAction = custom_data.callType === 'app'
        ? {
            action: 'connect',
            ringbackTone: 'https://bigsoundbank.com/UPLOAD/wav/1618.wav',
            endpoint: [
                {
                    type: 'app',
                    user: custom_data.callee,
                },
            ],
        }
        : {
            action: 'connect',
            from: VONAGE_LVN,
            endpoint: [
                {
                    type: 'phone',
                    number: custom_data.callee,
                },
            ],
        };
    const ncco = [
        {
            action: 'talk',
            text:
                'This is a Demo of the Vonage Client SDKs using Supabase Functions',
        },
        {
            action: 'talk',
            text: 'Connecting you now, please wait.',
        },
        connectAction,
    ];

    console.log(JSON.stringify(ncco));
    return ncco;
};

const handleInboundCall = async (
    req: Request,
    _data: z.infer<typeof InboundCallSchema>,
) => {
    const adminClient = AdminClient(req);
    try {
        const { data, error } = await adminClient.from(
            'user_available_view_voice',
        )
            .select('*').limit(1).maybeSingle();
        if (error) {
            console.error(error);
            throw new Error('there was an error fetching available agents');
        }
        if (!data) {
            throw new Error('there are no agents available at this time');
        }

        const { error: err } = await adminClient.rpc(
            'set_user_presence_email',
            {
                user_email: data.email!,
                new_availability: data.availability!,
                new_status: 'BUSY',
            },
        );

        if (err) console.error(err);
        return [
            {
                action: 'talk',
                text:
                    'This is a Demo of the Vonage Client SDKs using Supabase Functions',
            },
            {
                action: 'talk',
                text: `Connecting you now to ${data.name} now, please wait.`,
            },
            {
                action: 'connect',
                ringbackTone: 'https://bigsoundbank.com/UPLOAD/wav/1618.wav',
                endpoint: [
                    {
                        type: 'app',
                        user: data.email,
                    },
                ],
            },
        ];
    } catch (error) {
        console.error(error);
        return [
            {
                action: 'talk',
                text:
                    'This is a Demo of the Vonage Client SDKs using Supabase Functions',
            },
            {
                action: 'talk',
                text: `Sorry, ${error.message}, please try again later.`,
            },
        ];
    }
};

serve(async (req) => {
    try {
        const data = schema.parse(await req.json());

        switch (data.kind) {
            case 'server_call':
                console.log('server_call', data);
                return new Response(
                    JSON.stringify(await handleServerCall(req, data)),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            case 'inbound_call':
                console.log('inbound_call', data);
                return new Response(
                    JSON.stringify(await handleInboundCall(req, data)),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
        }
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            console.error(error.issues);
            return new Response(
                JSON.stringify({
                    code: 'BAD_REQUEST',
                    message: error.message,
                    issues: error.issues,
                }),
                { status: 400 },
            );
        }
        if (error instanceof Error) {
            console.error(error.message);
            return new Response(
                JSON.stringify({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message,
                }),
                { status: 500 },
            );
        }

        console.error('Unknown error');
        return new Response(
            JSON.stringify({
                code: 'Unknown error',
                message: 'Unknown error',
            }),
            { status: 500 },
        );
    }
});

// To invoke:
// curl - i--location--request POST 'http://localhost:54321/functions/v1/' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
// --header 'Content-Type: application/json' \
// --data '{"name":"Functions"}'
