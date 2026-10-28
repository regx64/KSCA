// Server-side guards (README §5.2: access control by the account's role, not
// route middleware). Take the Supabase client as a parameter so they can be
// unit-tested with a stub; RLS remains the second line of defense.
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthRequiredError';
  }
}

export class AdminRequiredError extends Error {
  constructor() {
    super('Admin role required');
    this.name = 'AdminRequiredError';
  }
}

type AuthLike = {
  auth: { getUser: () => Promise<{ data: { user: User | null }; error: unknown }> };
};

// Only the profiles lookup is used; typed loosely so the real SupabaseClient
// (whose generics are very deep) and simple test stubs both fit.
type ProfileQueryLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: 'profiles') => any;
};

export async function requireUser(supabase: AuthLike): Promise<User> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new AuthRequiredError();
  return data.user;
}

export type Viewer = { user: User; profile: Pick<Profile, 'id' | 'nickname' | 'school' | 'role'> };

// The signed-in user plus their profile row, or null when logged out.
export async function getViewer(supabase: AuthLike & ProfileQueryLike): Promise<Viewer | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile }: { data: Partial<Profile> | null } = await supabase
    .from('profiles')
    .select('id, nickname, school, role')
    .eq('id', data.user.id)
    .maybeSingle();
  return {
    user: data.user,
    profile: {
      id: data.user.id,
      nickname: profile?.nickname ?? data.user.email?.split('@')[0] ?? '',
      school: profile?.school ?? null,
      role: profile?.role === 'admin' ? 'admin' : 'user',
    },
  };
}

export async function requireAdmin(supabase: AuthLike & ProfileQueryLike): Promise<Viewer> {
  const viewer = await getViewer(supabase);
  if (!viewer) throw new AuthRequiredError();
  if (viewer.profile.role !== 'admin') throw new AdminRequiredError();
  return viewer;
}
