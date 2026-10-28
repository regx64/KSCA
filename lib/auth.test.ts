import { describe, it, expect } from 'vitest';
import { requireUser, requireAdmin, getViewer, AuthRequiredError, AdminRequiredError } from './auth';

function stub(user: { id: string; email?: string } | null, profile: Record<string, unknown> | null = null) {
  return {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }) }),
    }),
  } as unknown as Parameters<typeof requireAdmin>[0];
}

describe('requireUser', () => {
  it('returns the user when a session exists', async () => {
    expect((await requireUser(stub({ id: 'u1' }))).id).toBe('u1');
  });
  it('throws AuthRequiredError when there is no session', async () => {
    await expect(requireUser(stub(null))).rejects.toBeInstanceOf(AuthRequiredError);
  });
});

describe('getViewer', () => {
  it('returns null when logged out', async () => {
    expect(await getViewer(stub(null))).toBeNull();
  });
  it('returns the profile role and nickname', async () => {
    const v = await getViewer(stub({ id: 'u1' }, { nickname: '민준', school: null, role: 'admin' }));
    expect(v?.profile).toEqual({ id: 'u1', nickname: '민준', school: null, role: 'admin' });
  });
  it('treats a missing profile as a plain user', async () => {
    const v = await getViewer(stub({ id: 'u1', email: 'kim@x.com' }, null));
    expect(v?.profile.role).toBe('user');
    expect(v?.profile.nickname).toBe('kim');
  });
});

describe('requireAdmin', () => {
  it('throws AuthRequiredError when logged out', async () => {
    await expect(requireAdmin(stub(null))).rejects.toBeInstanceOf(AuthRequiredError);
  });
  it('throws AdminRequiredError when logged in but not admin', async () => {
    await expect(requireAdmin(stub({ id: 'u1' }, { role: 'user' }))).rejects.toBeInstanceOf(AdminRequiredError);
  });
  it('returns the viewer when they are admin', async () => {
    const v = await requireAdmin(stub({ id: 'u1' }, { role: 'admin', nickname: 'a' }));
    expect(v.user.id).toBe('u1');
  });
});
