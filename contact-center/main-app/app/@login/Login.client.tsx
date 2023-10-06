'use client';
import { useSearchParams } from 'next/navigation';
import { useSupabase } from '../supabase-provider';
import { useEffect, useState } from 'react';
import { SupportedProviders } from 'supabase-helpers';
import { LoginBtn, redirect } from './LoginBtn.client';

export const Login = () => {
    const { supabase } = useSupabase();
    const params = useSearchParams();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleLogin = () => {
        supabase.auth.signInWithOtp({
            email, options: {
                emailRedirectTo: redirect
            }
        }).then(({ error }) => {
            if (error) setError(error.message);
            else setSent(true);
        });
    };

    const clearError = () => setError(null);

    if (sent) return (
        <div className='h-full hero'>
            <div className='text-center hero-content'>
                <div className='max-w-md'>
                    <h1 className='mb-5 text-5xl font-bold'>Check your email</h1>
                    <p className='mb-5'>
                        We&apos;ve sent you a magic link via email to sign in. You may need to check your spam folder.
                    </p>

                    <div className=' btn-group'>
                        <button className='btn btn-primary' onClick={handleLogin}>Resend Email</button>
                        <button className='btn' onClick={()=>setSent(false)}>
                            Use a different method
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (<>
        {SupportedProviders.map((provider) => (
            <LoginBtn key={provider} provider={provider} />
        ))}
        <div className="form-control">
            <label className='input-group'>
                <span>Email</span>
                <input className=' input' type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <button className="btn btn-primary" onClick={handleLogin} >Login with Email </button>
            </label>
            {error ? <label className='label'>
                <div className="text-red-500">{error}</div>
            </label> : null}
        </div>
    </>
    );
};
