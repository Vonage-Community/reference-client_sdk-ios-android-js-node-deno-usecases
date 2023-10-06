import { z } from 'zod';
import { mintDeviceRefreshToken, mintVonageToken } from '../token.ts';
import { AdminClient } from '../supabaseClient.ts';
import { availabilityMap, devicesBaseSchema, statusMap } from './utils.ts';

const DEVICE_CODE_SALT = Deno.env.get('DEVICE_CODE_SALT') ?? 'salt';

export const LoginSchema = devicesBaseSchema.extend({
    type: z.literal('login'),
    code: z.string(),
    status: z.nativeEnum(statusMap).default(statusMap.available),
    availability: z.nativeEnum(availabilityMap).default(availabilityMap.all),
});

const InvalidCodeError = new Error('Invalid device code');

export const codeLogin = async (client: ReturnType<typeof AdminClient>, data: z.infer<typeof LoginSchema>): Promise<Response> => {
    try {
        const { data: device_id, error } = await client.rpc('verify_device_code', { device_code: data.code, salt: DEVICE_CODE_SALT });

        if (error || !device_id) {
            console.error('Error verifying device code', error);
            throw InvalidCodeError;
        }

        const { data: userIdData, error: userIdErr } = await client.from('devices').select('user_id').eq('id', device_id).single();

        if (userIdErr || !userIdData) {
            console.error('Error getting user id', userIdErr);
            throw InvalidCodeError;
        }
        console.log('userId', userIdData.user_id);

        const { data: username, error: usernameErr } = await client.from('user_profile').select('email').eq('user_id', userIdData.user_id).single();

        if (usernameErr || !username) {
            console.error('Error getting username', usernameErr);
            throw InvalidCodeError;
        }

        const { error: pingError } = await client.rpc('set_user_presence_device', {
            device_id: device_id,
            new_status: data.status,
            new_availability: data.availability
        });

        if (pingError) {
            console.error('Error pinging user presence', pingError);
            throw new Error('Error pinging user presence');
        }

        const vonageToken = await mintVonageToken(Deno.env.get('VONAGE_PRIVATE_KEY') ?? '', Deno.env.get('VONAGE_APPLICATION_ID') ?? '', username.email);

        const refreshToken = await mintDeviceRefreshToken(Deno.env.get('DEVICE_REFRESH_TOKEN_SECRET') ?? '', {
            deviceId: device_id,
            userId: userIdData.user_id,
        });

        return new Response(JSON.stringify({
            vonageToken,
            refreshToken,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        if (err === InvalidCodeError) return new Response(
            JSON.stringify({ error: 'Invalid device code', }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
        }
        );
        console.error('Error logging in with device code', JSON.stringify(err));
        throw new Error('Internal server error: device code login');
    }
};