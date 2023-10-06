// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { AdminClient, UserClient } from '../supabaseClient.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'zod';
import { corsHeaders } from '../cors.ts';
import { newDevice, NewDeviceSchema } from './newDevice.ts';
import { newCode, NewCodeSchema } from './newDeviceCode.ts';
import { RefreshSchema, refreshToken } from './tokenRefresh.ts';
import { codeLogin, LoginSchema } from './login.ts';
import { updatePresence, updatePresenceSchema } from './logout.ts';
import { getHandlerLogger } from '../logger.ts';

const logger = getHandlerLogger('devices');
logger.info('Loading Devices Handler');
const deviceSchema = z.discriminatedUnion('type', [
    NewDeviceSchema,
    NewCodeSchema,
    LoginSchema,
    RefreshSchema,
    updatePresenceSchema,
]);

serve(async (req) => {
    logger.info(`${req.method} Request received`);
    logger.debug({ req });

    if (req.method === 'OPTIONS') {
        logger.info('returning cors headers');
        return new Response('ok', { headers: corsHeaders });
    }
    try {
        const body = await req.json();
        logger.debug('Request body', body);
        const data = await deviceSchema.parseAsync(body);
        switch (data.type) {
            case 'new_device':
                return await newDevice(UserClient(req), data);
            case 'new_code':
                return await newCode(UserClient(req), data);
            case 'login':
                return await codeLogin(AdminClient(), data);
            case 'refresh':
                return await refreshToken(AdminClient(), data);
            case 'update_presence':
                return await updatePresence(AdminClient(), data);
            default:
                return new Response(
                    JSON.stringify({ error: 'Type not implemented' }),
                    {
                        status: 501,
                        headers: {
                            ...corsHeaders,
                            'content-type': 'application/json',
                        },
                    },
                );
        }
    } catch (e) {
        logger.critical('Error handling request', e);

        if (e instanceof z.ZodError) {
            logger.critical('There was a zod validation error', e.issues);
            return new Response(JSON.stringify({ error: e.issues }), {
                status: 400,
                headers: { ...corsHeaders, 'content-type': 'application/json' },
            });
        }

        if (e instanceof Error) {
            logger.critical('There was an error', e.message);
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { ...corsHeaders, 'content-type': 'application/json' },
            });
        }

        logger.critical('There was an unknown error', e);
        return new Response(JSON.stringify({ error: 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
        });
    }
});