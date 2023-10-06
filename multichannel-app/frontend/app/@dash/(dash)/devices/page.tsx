import { headers, cookies } from 'next/headers';
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NewDevice } from './NewDevice';
import { NewCode } from './NewCode';
import { Device } from './Device';

export default async function Page() {
    const supabase = createServerComponentSupabaseClient({ headers, cookies });

    const getDevices = async () => {
        const { data, error } = await supabase.from('devices').select('*');

        if (error) {
            console.error(error);
            throw error;
        }

        return data;
    };

    const devices = await getDevices();

    return (
        <div className='flex flex-col w-full h-full'>
            <h1 className='mb-4 text-2xl font-bold'>Devices</h1>
            <table className='table w-full'>
                <thead>
                    <tr>
                        <td className='w-1/6 '>Device Name</td>
                        <th className='w-3/6 '></th>
                        <th className='w-2/6'></th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device, index) => (
                        <Device key={device.id} id={device.id} name={device.device_name} index={index} />
                    ))}
                    <NewDevice />
                </tbody>
            </table>
        </div>
    );
}
