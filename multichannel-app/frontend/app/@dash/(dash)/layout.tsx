import { ReactNode } from 'react';
import { headers, cookies } from 'next/headers';
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { VonageClientProvider } from '@vonage/client-sdk-react';


import { UserProfileWidget } from './UserProfileWidget.server';

import '@vonage/client-sdk-react/dist/vonage-client-sdk-react.css';
import { Database } from 'supabase-helpers';
import { Logo } from '../../../components/logo';
import { NavLink } from './navLink';
import { getToken } from '../../api/token';
import React from 'react';



const MainLayout = async ({ children }: { children: ReactNode }) => {
    const token = cookies().get('vonage.token')?.value as string;
    return (
        <div className='flex flex-col h-full w-full gap-4 lg:flex-row max-h-full max-w-full' >
            <aside className='relative   flex flex-row w-full rounded-lg bg-base-300 lg:w-3/12 min-h-16 lg:h-full lg:flex-col'>
                <div className='flex flex-row items-center justify-center h-16 lg:w-full lg:h-24'>
                    <Logo />
                </div>
                <ul className='w-full py-4 menu menu-horizontal lg:menu-vertical '>
                    <li className='hover-bordered'>
                        <NavLink href='/'>
                            Create Chat
                        </NavLink>
                    </li>
                    <li className='hover-bordered'>
                        <NavLink href='/chat' parallelRouteKey='conversationList'>
                            Chat List
                        </NavLink>
                    </li>
                </ul>

                <UserProfileWidget className='absolute inset-y-2 lg:top-auto right-2 lg:inset-x-2 lg:w-auto lg:bottom-4' />
            </aside>
            <main className='w-full h-full max-h-screen'>
                <VonageClientProvider token={token}>
                    {children}
                </VonageClientProvider>
            </main>
        </div>
    );
};

export default MainLayout;