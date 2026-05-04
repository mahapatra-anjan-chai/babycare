// Browser client — safe to import in Client Components
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10

// Silent no-op stub used in demo mode (no Supabase env vars configured).
// Matches the shape of the real client — returns empty/null for all calls.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopClient: any = new Proxy(
  {},
  {
    get(_target, prop) {
      // auth methods used by the app
      if (prop === 'auth') {
        return {
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithOAuth: async () => ({ error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        }
      }
      // table query builder — chain .select().eq().single() etc. all return empty
      return () => noopClient
    },
  }
)

export function createClient() {
  if (!isSupabaseConfigured) return noopClient
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
