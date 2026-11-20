import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

/**
 * Server client for Next.js App Router (Server Components, Route Handlers, Server Actions).
 * Automatically handles cookie reading and writing via Next.js cookies().
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey || url.includes('your-project-id')) return null;

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Middleware handles cookie refreshes; safe to catch in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Middleware handles cookie refreshes; safe to catch in Server Components
        }
      },
    },
  });
}

/**
 * Administrative client using the Supabase Service Role Key.
 * Used exclusively for secure server operations such as verifying hashed API keys in webhooks
 * and bypasses RLS when explicitly required on the server.
 */
export function getServerSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !serviceKey || url.includes('your-project-id')) {
    return null;
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Retrieves the currently authenticated Supabase user from request cookies.
 * Returns null if the user is unauthenticated or if session is expired.
 */
export async function getAuthenticatedUser() {
  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

// Backward-compatible alias for existing code
export const getServerSupabase = getServerSupabaseAdmin;
