/* eslint-disable @next/next/no-img-element */
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { redirect } from 'next/navigation';

const md5 = (s: string) => createHash('md5').update(s).digest('hex');

const getGravatar = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
};

type UserProfileWidgetProps = {
    className?: string;
};

export const UserProfileWidget = ({ className }: UserProfileWidgetProps) => {

    const userName = cookies().get('vonage.user.name')?.value as string;
    const avatarUrl = getGravatar(`${userName}@vonage.com`);

    const logout = async () => {
        'use server';
        cookies().delete('vonage.token');
        cookies().delete('vonage.user.id');
        cookies().delete('vonage.user.name');
        redirect('/');
    };


    return (
    <div className={`dropdown dropdown-end lg:dropdown-right ${className}`}>
        <label tabIndex={0} role='button' className={'rounded-xl flex flex-row items-center outline-none focus:ring-4 hover:ring-4 ring-offset-4 ring-primary ring-offset-base-200'}>
            
            <div className='avatar'>
                <div className="w-12 mask mask-squircle">
                    <img src={avatarUrl} alt='User Avatar' />
                </div>
            </div>
            <div className='flex-col justify-center hidden ml-2 md:flex'>
                    <h2 className='text-base font-bold'>{userName}</h2>
            </div>
        </label>
            <ul tabIndex={0} className='w-full p-2 mt-4 shadow menu dropdown-content bg-base-200 rounded-xl'>
                <li>
                    <form action={logout}>
                        <button type='submit'>
                            Logout
                        </button>
                    </form>
                </li>
        </ul>
    </div>
    );
};
