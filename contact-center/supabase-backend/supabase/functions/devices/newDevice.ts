import { z } from 'zod';
import { UserClient } from '../supabaseClient.ts';
import { corsHeaders } from '../cors.ts';
import { Device, makeDeviceCode } from './utils.ts';


export const NewDeviceSchema = z.object({
    type: z.literal('new_device'),
    name: z.string(),
});

export const newDevice = async (client: ReturnType<typeof UserClient>, data: z.infer<typeof NewDeviceSchema>) => {
    const { data: { user }, error: UserErr } = await client.auth.getUser();
    if (UserErr || !user) {
        throw new Error('Error getting user');
    }
    const { data: deviceData, error: deviceError } = await client.from('devices').insert({
        device_name: data.name,
        user_id: user.id,
    }).select().single();
    if (deviceError) {
        console.error('Error creating device', deviceError);
        throw new Error('Error creating device');
    }
    const device = {
        id: deviceData?.id ?? '',
        name: deviceData?.device_name ?? ''
    } satisfies Device;

    const deviceCode = await makeDeviceCode(client, device);

    return new Response(JSON.stringify({
        device,
        deviceCode
    }), { headers: { 'content-type': 'application/json', ...corsHeaders } });
};
