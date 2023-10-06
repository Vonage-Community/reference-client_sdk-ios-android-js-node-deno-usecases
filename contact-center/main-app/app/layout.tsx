import { SupabaseProvider } from './supabase-provider';
import { headers, cookies } from 'next/headers';


import './globals.css';
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from 'supabase-helpers';

const getSession = async () => {
  const supabase = createServerComponentSupabaseClient<Database>({
        headers,
        cookies,
    });

  const { data } = await supabase.auth.getSession();

  return data.session;
};

export default async function RootLayout({login, dash}: { login: React.ReactNode, dash: React.ReactNode}) {
  const session = await getSession();

  const isSessionValid = session?.expires_at && session.expires_at > Date.now() / 1000;
  return (
    <html lang="en">
      <SupabaseProvider>
          <body className='w-screen h-screen p-4'>
              {session && isSessionValid? dash : login}
          </body>
      </SupabaseProvider>
    </html>
  );

  
}
