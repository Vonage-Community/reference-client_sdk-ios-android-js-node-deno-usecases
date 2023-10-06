'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'supabase-helpers';


type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

type SupabaseProviderProps = {
    children: React.ReactNode
}

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
    const [supabase] = useState(() => createBrowserSupabaseClient());
    const router = useRouter();


    useEffect(() => {
        const { data: {subscription} } = supabase.auth.onAuthStateChange(() => { router.refresh(); });
        return () => { subscription?.unsubscribe(); };
    }, [router, supabase]);

    return (
        <SupabaseContext.Provider value={{ supabase }}>
            {children}
        </SupabaseContext.Provider>
    );      
};

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};