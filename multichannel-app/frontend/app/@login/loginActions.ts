'use server';

import { cookies } from 'next/headers';
import { getToken } from '../api/token';
import { csClient } from '../api/utils';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
    email: z.string().email('Must be a email').endsWith('@vonage.com', 'Invalid email'),
});


const getOrCreateUser = (email: string) => {
    return csClient(`/users/${email}`, 'GET')
        .catch(e => {
            if (e instanceof Response && e.status == 404) {
                console.error(e);
                return csClient('/users', 'POST', {
                    name: email,
                    display_name: email.split('@')[0]
                });
            }
        });
};
export const handleLogin = async (_: any, formData: FormData) => {
    console.log('handleLogin', formData);
    const { email } = loginSchema.parse({
        email: formData.get('email')
    });

    // check if user exists in CS
    try {
        await getOrCreateUser(email);
    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
            return { error: e.message };
        }
        if (e instanceof Response) {
            console.error(e);
            return { error: 'CS error', status: e.status, statusText: e.statusText, body: JSON.stringify(e) };
        }
    }
    const token = await getToken(email);
    cookies().set('vonageToken', token);
    redirect(`/?token=${token}`);
};