'use client';

import { useState } from 'react';
import { useSupabase } from '../../../supabase-provider';
import { useRouter } from 'next/navigation';
import { IconClipboardCopy } from '@tabler/icons-react';

export const NewDevice = () => {
    const { supabase } = useSupabase();
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const [code, setCode] = useState<string>(undefined);

    const handleNewDevice = async () => {
        if (loading) return;
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('devices', {
            body: {
                type: 'new_device',
                name
            }
        });
        if (error) {
            console.error(error);
        }
        console.log(data);
        setCode(data.deviceCode);

        // Expire the code after 5 minutes
        setTimeout(() => {
            setCode(undefined);
            setName('');
        }, 5 * 60 * 1000);

        setLoading(false);
        router.refresh();
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
    };

    const handleAddAnotherDevice = () => {
        setCode(undefined);
        setName('');
    };

    if (code) {
        return (
            <tr className=' active'>
                <td>
                    Made a new device!
                </td>
                <td>{name}</td>
                <td className='flex justify-between'>
                    <button className='btn btn-primary' onClick={copyCode} >
                        <span className='mr-2' >{code}</span>
                        <IconClipboardCopy />
                    </button>

                    <button className='btn btn-primary' onClick={handleAddAnotherDevice} disabled={loading} >
                        Add Another Device
                    </button>
                </td>
            </tr>
        );
    };

    return (
        <tr>
            <td colSpan={2}>
                <input type='text' className='w-full input input-bordered' placeholder='Device Name' value={name} onChange={(e) => setName(e.target.value)} />
            </td>
            <td>
                <button className='btn btn-primary btn-block' onClick={handleNewDevice} disabled={loading} >{loading ? 'Loading...' : 'Create Device'}</button>
            </td>
        </tr>
    );
};