// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { UserClient } from '../supabaseClient.ts';
import { mintVonageToken } from '../token.ts';
import { getHandlerLogger } from '../logger.ts';

const privateKey = Deno.env.get('VONAGE_PRIVATE_KEY');
const applicationId = Deno.env.get('VONAGE_APPLICATION_ID');

const logger = getHandlerLogger('new-vonage-token');
logger.info('Loading Webhook Handler');

serve(async (req) => {
    logger.info(`${req.method} Request received`);
    logger.debug({ req });

    if (!privateKey || !applicationId) {
        logger.error('Missing VONAGE_PRIVATE_KEY or VONAGE_APPLICATION_ID');
        throw new Error('Missing VONAGE_PRIVATE_KEY or VONAGE_APPLICATION_ID');
    }
    // const client = UserClient(req);
    logger.debug('Getting user');
    // const { data: { user }, error } = await client.auth.getUser();
    // if (error) {
    //     logger.error('Error getting user', error);
    //     return new Response(JSON.stringify(error), { status: 500 });
    // }
    // if (!user || !user.email) {
    //     logger.error('Missing user or user.email');
    //     return new Response(
    //         JSON.stringify({
    //             error: 'Missing user or user.email',
    //         }),
    //         { status: 401 },
    //     );
    // }
    try {
        const token = await mintVonageToken(
            privateKey,
            applicationId,
            // user.email,
        );
        return new Response(
            JSON.stringify({ token }),
            { headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        logger.error(error);
        return new Response(JSON.stringify(error), { status: 500 });
    }
});
