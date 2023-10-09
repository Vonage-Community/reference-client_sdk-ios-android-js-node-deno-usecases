import { ReactNode } from 'react';
import { headers, cookies } from 'next/headers';
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { VonageClientProvider } from '@vonage/client-sdk-react';
import { nanoid } from 'nanoid';
import * as jose from 'jose';

import { UserProfileWidget } from './UserProfileWidget.server';
import { getUserProfile } from './utils';

import '@vonage/client-sdk-react/dist/vonage-client-sdk-react.css';
import { Database } from 'supabase-helpers';
import { Logo } from '../../../components/logo';
import { NavLink } from './navLink';

const applicationId = process.env.VONAGE_APPLICATION_ID;
const privateKey = process.env.VONAGE_PRIVATE_KEY;

const acl = {
    'paths': {
        '/*/users/**': {},
        '/*/conversations/**': {},
        '/*/sessions/**': {},
        '/*/devices/**': {},
        '/*/image/**': {},
        '/*/media/**': {},
        '/*/applications/**': {},
        '/*/push/**': {},
        '/*/knocking/**': {},
        '/*/legs/**': {}
    }
};

export const revalidate = 0;


const getToken = async () => {
    const { email } = await getUserProfile();

    const key = await jose.importPKCS8(privateKey!, '');
    const payload = {
        application_id: applicationId,
        sub: email,
        acl
    };

    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + 3600) // 1 hour
        .setJti(nanoid())
        .sign(key);


    return token;
};

const MainLayout = async ({ children }: { children: ReactNode }) => {
    const token = await getToken();

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
                    {/* <li className='hover-bordered'>
                <NavLink href='/profile'>
                    Profile
                </NavLink>
            </li> */}
                    {/* <li className='hover-bordered'>
                <NavLink href='/settings'>
                    Settings
                </NavLink>
            </li> */}
                    <li className='hover-bordered'>
                        <NavLink href='/devices'>
                            Devices
                        </NavLink>
                    </li>
                </ul>

                {/* @ts-expect-error Async Server Component */}
                <UserProfileWidget className='absolute inset-y-2 lg:top-auto right-2 lg:inset-x-2 lg:w-auto lg:bottom-4' />
            </aside>
            <main className='w-full h-full max-h-screen'>
                <VonageClientProvider token={token} logLevel='debug'>
                    {children}
                </VonageClientProvider>
            </main>
        </div>
    );
};

export default MainLayout;