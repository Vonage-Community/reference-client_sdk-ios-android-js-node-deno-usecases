
import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import type { Database } from 'supabase-helpers';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient<Database>({ req, res });
  await supabase.auth.getSession();
  return res;
};

export const config = {
  matcher: '/((?!api|webhooks|_next/static|_next/image|favicon.ico).*)',
};