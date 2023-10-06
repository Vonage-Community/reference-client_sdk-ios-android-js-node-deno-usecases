import { z } from 'zod';
import { UserClient } from '../supabaseClient.ts';
import { corsHeaders } from '../cors.ts';
import { Device, makeDeviceCode } from './utils.ts';

export const NewCodeSchema = z.object({
    type: z.literal('new_code'),
    device_id: z.string(),
});

export const newCode = async (client: ReturnType<typeof UserClient>, data: z.infer<typeof NewCodeSchema>) => {
    const { data: deviceData, error: deviceError } = await client.from('devices').select().eq('id', data.device_id).single();
    if (deviceError) {
        console.error('Error getting device', deviceError);
        throw new Error('Error getting device');
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
