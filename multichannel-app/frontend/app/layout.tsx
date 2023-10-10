import { SupabaseProvider } from './supabase-provider';
import { headers, cookies } from 'next/headers';


import './globals.css';

export default async function RootLayout({login, dash}: { login: React.ReactNode, dash: React.ReactNode}) {
  const hasToken = cookies().has('vonageToken');
  return (
    <html lang="en">
      <SupabaseProvider>
          <body className='w-screen h-screen p-4'>
          {hasToken ? dash : login}
          </body>
      </SupabaseProvider>
    </html>
  );
}
