import { headers, cookies } from 'next/headers';
import './globals.css';

export default async function RootLayout({login, dash}: { login: React.ReactNode, dash: React.ReactNode}) {
  const hasToken = cookies().has('vonage.token');
  return (
    <html lang="en">
          <body className='w-screen h-screen p-4'>
          {hasToken ? dash : login}
      </body>
    </html>
  );
}
