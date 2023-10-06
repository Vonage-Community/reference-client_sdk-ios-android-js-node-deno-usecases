import { UserClient } from '../supabaseClient.ts';
import { z } from 'zod';

const DEVICE_CODE_SALT = Deno.env.get('DEVICE_CODE_SALT') ?? 'salt';

export type Device = {
    id: string;
    name: string;
};

export const makeDeviceCode = async (
    client: ReturnType<typeof UserClient>,
    data: Device,
) => {
    const { data: deviceCode, error: deviceCodeErr } = await client.rpc(
        'make_device_code',
        { device: data.id, salt: DEVICE_CODE_SALT },
    );
    if (deviceCodeErr || !deviceCode) {
        throw new Error('Error creating device code');
    }
    return deviceCode;
};

export const devicesBaseSchema = z.object({
    type: z.enum(['new_device', 'new_code', 'login', 'logout', 'refresh']),
});

export const availabilityMap = {
    voice: 'VOICE',
    chat: 'CHAT',
    all: 'ALL',
} as const;

export const statusMap = {
    available: 'AVAILABLE',
    offline: 'OFFLINE',
    busy: 'BUSY',
    DoNotDisturb: 'DO_NOT_DISTURB',
} as const;
