import { describe, it, expect } from 'vitest';
import { toThreadComments } from './comments';

describe('toThreadComments', () => {
  it('merges comments across versions in time order, keeping each version badge', () => {
    const out = toThreadComments([
      { id: 'b', author_id: 'u2', content: 'v2 comment', created_at: '2026-04-03', status: 'public', written_at_version: 2, profiles: { nickname: '운영진' } },
      { id: 'a', author_id: 'u1', content: 'v1 comment', created_at: '2026-03-15', status: 'public', written_at_version: 1, profiles: [{ nickname: '이서연' }] },
    ]);
    expect(out.map((c) => [c.id, c.version, c.authorNickname])).toEqual([
      ['a', 1, '이서연'],
      ['b', 2, '운영진'],
    ]);
  });
  it('omits version for board comments and tolerates missing profiles', () => {
    const [c] = toThreadComments([{ id: 'x', author_id: 'u', content: 'hi', created_at: '2026-01-01', status: 'hidden', profiles: null }]);
    expect(c).toEqual({ id: 'x', authorId: 'u', authorNickname: '알 수 없음', content: 'hi', createdAt: '2026-01-01', status: 'hidden' });
    expect('version' in c).toBe(false);
  });
});
