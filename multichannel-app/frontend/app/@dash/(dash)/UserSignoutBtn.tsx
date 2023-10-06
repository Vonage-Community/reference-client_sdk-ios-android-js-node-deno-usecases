'use client';

import { useSupabase } from '../../supabase-provider';

export const UserSignoutBtn = () => {
    const { supabase } = useSupabase();

    const handleLogout = async () => {
        const { error: presenceError } = await supabase.rpc('set_user_presence', {
            new_availability:'ALL',
            new_status:'OFFLINE',
        });

        if (presenceError) {
            console.error(presenceError);
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error(error);
        }
    };

    return (
        <li>
            <a onClick={handleLogout} >Logout</a>
        </li>
    );
};
