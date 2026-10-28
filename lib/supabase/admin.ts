import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS. Server-only, and used ONLY for Storage
// signed URL issuance on the private `papers` bucket (README §7). Never use it
// for table reads/writes — those must go through RLS.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
