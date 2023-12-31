import { z } from 'zod';
import { getWebhookLogger } from '../logger';
import { csClient } from '../utils';
import { type } from 'os';

const logger = getWebhookLogger('voice-answer');
logger.info('Loading Webhook Handler');

const VONAGE_LVN = process.env.VONAGE_LVN ?? '';

const zodJson = <T extends z.ZodTypeAny>(scheme: T) =>
    z.string().transform((value) => JSON.parse(value)).pipe(scheme);

const appCallCustomDataSchema = z.object({
    callType: z.literal('app'),
    username: z.string(),
});

const phoneCallCustomDataSchema = z.object({
    callType: z.literal('phone'),
    number: z.string(),
});

const conversationCallCustomDataSchema = z.object({
    callType: z.literal('conversation'),
    name: z.string(),
});

const customDataSchema = zodJson(z.discriminatedUnion('callType', [
    appCallCustomDataSchema,
    phoneCallCustomDataSchema,
    conversationCallCustomDataSchema,
]));



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

    if (custom_data.callType == 'conversation') {
        return [
            {
                action: 'talk',
                text: 'Hello inapp user, connecting you now',
            },
            {
                action: 'conversation',
                name: custom_data.name
            }
        ];
    }
    else if (custom_data.callType == 'phone') {
        return [
            {
                action: 'talk',
                text: 'Hello inapp user, connecting you now, please wait.',
            },
            {
                action: 'connect',
                endpoint: [
                    {
                        type: 'phone',
                        number: custom_data.number
                    }
                ]
            }
        ];
    } else {
        return [
            {
                action: 'talk',
                text: 'Connecting you now, please wait.',
            },
            {
                action: 'connect',
                endpoint: [
                    {
                        type: 'app',
                        user: custom_data.username
                    }
                ]
            }
        ];
    }
};

const handleInboundCall = async (
    _req: Request,
    data: z.infer<typeof InboundCallSchema>,
) => {
    logger.info('Inbound call received');
    try {
        const ncco = [
            {
                action: 'talk',
                text: 'Insert the conversation code followd by #',
                'bargeIn': true
            },
            {
                'action': 'input',
                'type': ['dtmf'],
                'dtmf': {
                    'maxDigits': 8,
                    'submitOnHash': true,
                    'timeOut': 10
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
                text: `Sorry, ${(error as Error).message}, please try again later.`,
            },
        ];
        logger.debug('Returning NCCO', ncco);
        return ncco;
    }
};

export const POST = async (req: Request) => {
    logger.info(`${req.method} Request received webhook-voice-answer`);
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
};