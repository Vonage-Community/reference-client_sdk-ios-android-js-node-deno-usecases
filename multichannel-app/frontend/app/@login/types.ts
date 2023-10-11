import { z } from 'zod';

export type LoginState = {
    error?: string,
    body?: any,
    status?: number,
    statusText?: string,
    email: string,
}
export const defaultLoginState = {
    error: undefined,
    body: undefined,
    status: undefined,
    statusText: undefined,
    email: '',
} satisfies LoginState;

export const loginSchema = z.object({
    email: z.string().email('Must be a email').endsWith('@vonage.com', 'Invalid email'),
});
