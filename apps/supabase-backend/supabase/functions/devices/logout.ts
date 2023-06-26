import { z } from 'zod';
import { verifyDeviceRefreshToken } from '../token.js';
import { AdminClient } from '../supabaseClient.js';
import { InvalidTokenError } from './tokenRefresh.js';
import { availabilityMap, devicesBaseSchema, statusMap } from './utils.js';


export const updatePresenceSchema = devicesBaseSchema.extend({
    type: z.literal('update_presence'),
    refreshToken: z.string(),
    status: z.nativeEnum(statusMap),
    availability: z.nativeEnum(availabilityMap),
});

export const updatePresence = async (client: ReturnType<typeof AdminClient>, data: z.infer<typeof updatePresenceSchema>): Promise<Response> => {
    try {
        const tokenData = await verifyDeviceRefreshToken(Deno.env.get('DEVICE_REFRESH_TOKEN_SECRET') ?? '', data.refreshToken);
        if (!tokenData) {
            throw InvalidTokenError;
        }

        const { error } = await client.rpc('set_user_presence_device', {
            device_id: tokenData.deviceId,
            new_status: data.status,
            new_availability: data.availability
        });

        if (error) {
            console.error('Error pinging user presence', error);
            throw new Error('Error pinging user presence');
        }

        return new Response('OK', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (_err) {
        return new Response(
            JSON.stringify({ error: 'Invalid refresh token', }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

};