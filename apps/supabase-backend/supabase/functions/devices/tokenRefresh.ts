import { z } from 'zod';
import {
    mintDeviceRefreshToken,
    mintVonageToken,
    verifyDeviceRefreshToken,
} from '../token.ts';
import { AdminClient } from '../supabaseClient.ts';
import { availabilityMap, devicesBaseSchema, statusMap } from './utils.ts';

export const RefreshSchema = devicesBaseSchema.extend({
    type: z.literal('refresh'),
    refreshToken: z.string(),
    status: z.nativeEnum(statusMap).default(statusMap.available),
    availability: z.nativeEnum(availabilityMap).default(availabilityMap.all),
});

export const InvalidTokenError = new Error('Invalid refresh token');

export const refreshToken = async (
    client: ReturnType<typeof AdminClient>,
    data: z.infer<typeof RefreshSchema>,
): Promise<Response> => {
    try {
        const tokenData = await verifyDeviceRefreshToken(
            Deno.env.get('DEVICE_REFRESH_TOKEN_SECRET') ?? '',
            data.refreshToken,
        );
        if (!tokenData) {
            throw InvalidTokenError;
        }

        const { data: device_id, error: deviceIdErr } = await client.from(
            'devices',
        ).select('id').eq('id', tokenData.deviceId).eq(
            'user_id',
            tokenData.userId,
        ).single();

        if (deviceIdErr || !device_id) {
            console.error('Error getting device id', deviceIdErr);
            throw InvalidTokenError;
        }

        const { data: username, error: usernameErr } = await client.from(
            'user_profile',
        ).select('email').eq('user_id', tokenData.userId).single();
        if (usernameErr || !username) {
            console.error('Error getting username', usernameErr);
            throw InvalidTokenError;
        }

        const { error: pingError } = await client.rpc(
            'set_user_presence_device',
            {
                device_id: tokenData.deviceId,
                new_status: data.status,
                new_availability: data.availability,
            },
        );

        if (pingError) {
            console.error('Error pinging user presence', pingError);
            throw new Error('Error pinging user presence');
        }

        const vonageToken = await mintVonageToken(
            Deno.env.get('VONAGE_PRIVATE_KEY') ?? '',
            Deno.env.get('VONAGE_APPLICATION_ID') ?? '',
            username.email,
        );
        const refreshToken = await mintDeviceRefreshToken(
            Deno.env.get('DEVICE_REFRESH_TOKEN_SECRET') ?? '',
            tokenData,
        );

        return new Response(
            JSON.stringify({
                vonageToken,
                refreshToken,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (err) {
        if (err === InvalidTokenError) {
            return new Response(
                JSON.stringify({ error: 'Invalid refresh token' }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
        throw err;
    }
};
