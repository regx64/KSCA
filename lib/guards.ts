import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminRequiredError, AuthRequiredError, requireAdmin, type Viewer } from '@/lib/auth';
import { loginHref } from '@/lib/paths';

// Page-level admin gate (README §5.2): checks profiles.role on the server,
// redirecting anonymous users to /login and non-admins to /. Not middleware;
// RLS (is_admin / role checks in policies) is the second layer.
export async function requireAdminPage(path: string): Promise<{ viewer: Viewer; supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  try {
    return { viewer: await requireAdmin(supabase), supabase };
  } catch (e) {
    if (e instanceof AuthRequiredError) redirect(loginHref(path));
    if (e instanceof AdminRequiredError) redirect('/');
    throw e;
  }
}
