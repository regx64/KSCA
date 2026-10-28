import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Secret-key client (`sb_secret_...`, the replacement for the legacy
// service_role JWT): bypasses RLS. Server-only — Supabase rejects secret keys
// sent from browsers — and used ONLY for Storage signed URL issuance on the
// private `papers` bucket (README §7). Never use it for table reads/writes —
// those must go through RLS.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
