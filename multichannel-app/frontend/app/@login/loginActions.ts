'use server';

import { cookies } from 'next/headers';
import { getToken } from '../api/token';
import { csClient, getOrCreateUser } from '../api/utils';
import { z } from 'zod';
import { redirect } from 'next/navigation';

import { match, P } from 'ts-pattern';
import { type LoginState, loginSchema } from './types';


export const handleLogin = async (_: LoginState, formData: FormData) => {
    try {
        const { email } = loginSchema.parse({
            email: formData.get('email')
        });
        // check if user exists in CS
        const { id, display_name, name } = await getOrCreateUser(`${email}:app`);
        const expirationSeconds = 3600; // 1 hour
        const token = await getToken(name);
        cookies().set('vonage.token', token, {
            expires: new Date(Date.now() + expirationSeconds * 1000),
        });
        cookies().set('vonage.user.id', id, {
            expires: new Date(Date.now() + expirationSeconds * 1000),
        });
        cookies().set('vonage.user.name', display_name || email.split('@')[0]), {
            expires: new Date(Date.now() + expirationSeconds * 1000),
        };
        redirect('/');
    } catch (e) {
        return match(e)
            .with(P.instanceOf(Error), e => {
                console.error(e.message);
                return { error: e.message };
            })
            .with(P.instanceOf(z.ZodError), e => {
                console.error(e);
                return { error: e.message, body: e.issues };
            })
            .with(P.instanceOf(Response), e => {
                console.error(e);
                return { error: 'CS error', status: e.status, statusText: e.statusText, body: JSON.stringify(e) };
            })
            .otherwise(() => {
                console.error(e);
                return { error: 'Unknown error' };
            });
    }

};