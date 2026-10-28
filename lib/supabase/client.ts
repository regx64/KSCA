import { createBrowserClient } from '@supabase/ssr';

// Browser client (Client Components). Only used for the direct-to-Storage
// signed upload; every other read/write goes through the server.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
