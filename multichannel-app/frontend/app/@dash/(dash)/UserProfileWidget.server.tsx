/* eslint-disable @next/next/no-img-element */
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { headers, cookies } from 'next/headers';
import { Database } from 'supabase-helpers';
import { createHash } from 'crypto';
import Link from 'next/link';
import { UserSignoutBtn } from './UserSignoutBtn';
import { getUserProfile } from './utils';

const md5 = (s: string) => createHash('md5').update(s).digest('hex');

const getGravatar = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
};

type UserProfileWidgetProps = {
    className?: string;
};

export const UserProfileWidget = async ({className}:UserProfileWidgetProps) => {
    
    const user = await getUserProfile();
    const avatarUrl = (user.avatar_url === null || user.avatar_url === '') ? getGravatar(user.email) : user.avatar_url;

    return (
    <div className={`dropdown dropdown-end lg:dropdown-right ${className}`}>
        <label tabIndex={0} role='button' className={'rounded-xl flex flex-row items-center outline-none focus:ring-4 hover:ring-4 ring-offset-4 ring-primary ring-offset-base-200'}>
            
            <div className='avatar'>
                <div className="w-12 mask mask-squircle">
                    <img src={avatarUrl} alt='User Avatar' />
                </div>
            </div>
            <div className='flex-col justify-center hidden ml-2 md:flex'>
                <h2 className='text-base font-bold'>{user.username}</h2>
                <h3 className='text-sm text-gray-500'>{user.email}</h3>
            </div>
        </label>
        <ul tabIndex={0} className='w-full p-2 mt-4 shadow menu dropdown-content bg-base-200 rounded-xl'>
                {/* <UserSignoutBtn /> */}
        </ul>
    </div>
    );
};
