'use client';
import { useSearchParams } from 'next/navigation';
import { SupportedProvider } from 'supabase-helpers';
import { useSupabase } from '../supabase-provider';

export const redirect = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || 'http://localhost:3000';

type Props = {
    provider: SupportedProvider;
};

export const LoginBtn = ({provider}:Props) => {
    const { supabase } = useSupabase();
    const params = useSearchParams();

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({provider, options: {
            redirectTo: redirect,
        }});
        if (error) {
            console.error(error);
        }
    };

    return (
        <button className="btn btn-primary" onClick={handleLogin} >Login with {provider} </button>
    );
};