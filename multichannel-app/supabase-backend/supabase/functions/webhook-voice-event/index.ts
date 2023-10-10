import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';
import { getWebhookLogger } from '../logger.ts';
const logger = getWebhookLogger('voice-event');
logger.info('Loading Webhook Handler');

serve(async (req) => {
    logger.info(`${req.method} Request received`);
    logger.debug({ req });
    const json = await req.json();
    logger.debug({ json });

    try {
        const digits = json?.dtmf?.digits
        if(digits){
            const ncco = [
                {
                    action: 'talk',
                    text: `You are getting connected to the conversation named ${digits}`,
                },
                {
                    action: "conversation", 
                    name: digits
                }
            ];

            return new Response(
                    JSON.stringify(await ncco),
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