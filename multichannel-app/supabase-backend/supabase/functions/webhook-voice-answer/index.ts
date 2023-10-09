// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';
import { AdminClient } from '../supabaseClient.ts';
import { getWebhookLogger } from '../logger.ts';

const logger = getWebhookLogger('voice-answer');
logger.info('Loading Webhook Handler');

const VONAGE_LVN = Deno.env.get('VONAGE_LVN') ?? '';

const zodJson = <T extends z.ZodTypeAny>(scheme: T) =>
    z.string().transform((value) => JSON.parse(value)).pipe(scheme);
const customDataSchema = zodJson(z.object({
    callType: z.enum(['app', 'phone']),
    // callee: z.string(),
    connect_to_conversation: z.string().optional()
}));

const VoiceAnswerSchema = z.object({
    kind: z.enum(['server_call', 'inbound_call']),
    from: z.void(),
    from_user: z.string().optional(),
    custom_data: customDataSchema.optional(),
});

const ServerCallSchema = VoiceAnswerSchema.extend({
    kind: z.void().transform(() => 'server_call').pipe(
        z.literal('server_call'),
    ),
    from_user: z.string(),
    custom_data: customDataSchema,
});

const InboundCallSchema = VoiceAnswerSchema.extend({
    kind: z.void().transform(() => 'inbound_call').pipe(
        z.literal('inbound_call'),
    ),
    from: z.string(),
    to: z.string(),
    custom_data: z.void(),
    from_user: z.void(),
});

const schema = z.union([ServerCallSchema, InboundCallSchema]);

const handleServerCall = (
    _req: Request,
    { custom_data, from }: z.infer<typeof ServerCallSchema>,
) => {
    logger.info('Server call received');
    logger.debug(`custom data: ${JSON.stringify(custom_data)}`);
    // const connectAction = custom_data.callType === 'app'
    //     ? {
    //         action: 'connect',
    //         ringbackTone: 'https://bigsoundbank.com/UPLOAD/wav/1618.wav',
    //         endpoint: [
    //             {
    //                 type: 'app',
    //                 user: custom_data.callee,
    //             },
    //         ],
    //     }
    //     : {
    //         action: 'connect',
    //         from: VONAGE_LVN,
    //         endpoint: [
    //             {
    //                 type: 'phone',
    //                 number: custom_data.callee,
    //             },
    //         ],
    //     };

    let ncco: Array<object> = []

    if(custom_data.connect_to_conversation){
        ncco = [
            {
                action: 'talk',
                text: 'Hello inapp user, connecting you now, please wait.',
            },
            {
                action: "conversation", 
                name: custom_data.connect_to_conversation
            }
        ];
    } else if(from) {

        ncco = [{
                action: 'talk',
                text: 'Hello pstn user, where do you want to be connected',
        }]

    } else {
        ncco = [{
                action: 'talk',
                text: 'Wrong request',
        }]
    }

     
    logger.debug('Returning NCCO', ncco);
    return ncco;
};

const handleInboundCall = async (
    _req: Request,
    data: z.infer<typeof InboundCallSchema>,
) => {
    logger.info('Inbound call received');
    const adminClient = AdminClient();
    try {
        // logger.debug('fetching available agents');
        // const { data, error } = await adminClient.from(
        //     'user_available_view_voice',
        // )
        //     .select('*').limit(1).maybeSingle();
        // if (error) {
        //     logger.error('there was an error fetching available agents');
        //     throw new Error('there was an error fetching available agents');
        // }
        // if (!data) {
        //     logger.debug('there are no agents available at this time');
        //     throw new Error('there are no agents available at this time');
        // }
        // logger.debug(`available agent: ${JSON.stringify(data)}`);
        // const { error: err } = await adminClient.rpc(
        //     'set_user_presence_email',
        //     {
        //         user_email: data.email!,
        //         new_availability: data.availability!,
        //         new_status: 'BUSY',
        //     },
        // );

        // if (err) logger.error(err);
        const ncco = [
            {
                action: 'talk',
                text: `Tell us when to you want to be connected`,
                "bargeIn": true
            },
            {
                "action": "input",
                "type": [ "dtmf" ],	
                "dtmf": {
                    "maxDigits": 1
                }	
            }
        ];

        logger.info('Returning NCCO');
        logger.debug('Returning NCCO', ncco);
        return ncco;
    } catch (error) {
        logger.error('there was an error handling the inbound call', error);
        logger.info('Returning Fallback NCCO');
        const ncco = [
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
        logger.debug('Returning NCCO', ncco);
        return ncco;
    }
};

serve(async (req) => {
    logger.info(`${req.method} Request received`);
    logger.debug({ req });
    try {
        const json = await req.json();
        logger.debug({ json });
        const data = schema.parse(json);

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
        logger.critical('there was an error handling the request', error);
        if (error instanceof z.ZodError) {
            logger.critical('There was a Zod validation error', error.issues);
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
            logger.critical('There was an internal server error', error);
            return new Response(
                JSON.stringify({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message,
                }),
                { status: 500 },
            );
        }

        logger.critical('There was an unknown error', error);
        return new Response(
            JSON.stringify({
                code: 'Unknown error',
                message: 'Unknown error',
            }),
            { status: 500 },
        );
    }
});