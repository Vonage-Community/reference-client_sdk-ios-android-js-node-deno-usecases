import { createClient } from 'supabase';
import { Database } from './database.types.ts';

export const AdminClient = () =>
    createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
            auth: {
                persistSession: false,
            },
        },
    );

export const UserClient = (req: Request) =>
    createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: {
                headers: { Authorization: req.headers.get('Authorization')! },
            },
        },
    );

export const AnnonClient = (_req: Request) =>
    createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
