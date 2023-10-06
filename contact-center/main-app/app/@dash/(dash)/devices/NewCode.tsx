'use client';

import { useState } from 'react';
import { useSupabase } from '../../../supabase-provider';
import { IconClipboardCopy, IconRefresh } from '@tabler/icons-react';

type NewCodeProps = {
    device_id: string;
};

export const NewCode = ({ device_id }: NewCodeProps) => {
    const { supabase } = useSupabase();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState<string | undefined>(undefined);

    const handleNewCode = async () => {
        if (loading) return;
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('devices', {
            body: {
                type: 'new_code',
                device_id
             }
        });
        if (error) {
            console.error(error);
        }

        // Expire the code after 5 minutes
        setTimeout(() => {
            setCode(undefined);
        }, 5 * 60 * 1000);

        setCode(data.deviceCode);
        setLoading(false);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code!);
    };

    if (code) return (
        <div className=' btn-group'>
            <button className='btn btn-primary' onClick={copyCode} aria-label='Copy Code' >
                <span className='mr-2' >{code}</span>
                <IconClipboardCopy />
            </button>
            <button className='btn btn-primary' onClick={handleNewCode} disabled={loading} >
                <IconRefresh />
            </button>
        </div>
    );


    return (
        <button className='btn btn-primary' onClick={handleNewCode} disabled={loading} >{loading ? 'Loading...' : 'Create Code'}</button>
    );
};