import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { Database } from 'supabase-helpers';

export const getUserProfile = async () => {
    const supabase = createServerComponentSupabaseClient<Database>({
        headers,
        cookies,
    });
    const { data, error } = await supabase.from('user_profile').select('*').eq('user_id', (await supabase.auth.getUser()).data?.user?.id).single();

    if (error) {
        console.error(error);
        throw error;
    }
    return data;
};