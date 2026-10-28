import { describe, it, expect } from 'vitest';
import { applyResolution, groupReportsByTarget, statusForDecision, TABLE_BY_TARGET, type ModerationClient } from './moderation';
import type { TargetType } from './types';

type Call = { table: string; values: Record<string, unknown>; filters: [string, string][] };

function recordingClient(failOn?: string) {
  const calls: Call[] = [];
  const client: ModerationClient = {
    from: (table) => ({
      update: (values: Record<string, unknown>) => {
        const call: Call = { table, values, filters: [] };
        calls.push(call);
        const builder: any = {
          eq: (col: string, val: string) => {
            call.filters.push([col, val]);
            return builder;
          },
          then: (resolve: any) => resolve({ error: table === failOn ? { code: '42501' } : null }),
        };
        return builder;
      },
    }),
  };
  return { client, calls };
}

describe('statusForDecision', () => {
  it('confirm keeps content hidden, restore makes it public', () => {
    expect(statusForDecision('confirm')).toBe('hidden');
    expect(statusForDecision('restore')).toBe('public');
  });
});

describe('applyResolution', () => {
  it.each(['paper', 'post', 'comment', 'paper_comment'] as TargetType[])(
    'updates the %s table and marks its pending reports reviewed',
    async (targetType) => {
      const { client, calls } = recordingClient();
      const res = await applyResolution(client, targetType, 't1', 'restore');
      expect(res.error).toBeNull();
      expect(calls).toEqual([
        { table: TABLE_BY_TARGET[targetType], values: { status: 'public' }, filters: [['id', 't1']] },
        {
          table: 'reports',
          values: { status: 'reviewed' },
          filters: [
            ['target_type', targetType],
            ['target_id', 't1'],
            ['status', 'pending'],
          ],
        },
      ]);
    }
  );

  it('confirm writes hidden', async () => {
    const { client, calls } = recordingClient();
    await applyResolution(client, 'post', 'p1', 'confirm');
    expect(calls[0].values).toEqual({ status: 'hidden' });
  });

  it('does not close reports if the content update fails', async () => {
    const { client, calls } = recordingClient('papers');
    const res = await applyResolution(client, 'paper', 'p1', 'restore');
    expect(res.error).toEqual({ code: '42501' });
    expect(calls.map((c) => c.table)).toEqual(['papers']);
  });
});

describe('groupReportsByTarget', () => {
  it('groups by target, most-reported first, then oldest', () => {
    const r = (target_type: TargetType, target_id: string, created_at: string) => ({ target_type, target_id, created_at });
    const groups = groupReportsByTarget([
      r('post', 'a', '2026-01-03'),
      r('paper', 'b', '2026-01-01'),
      r('post', 'a', '2026-01-02'),
      r('comment', 'c', '2026-01-04'),
    ]);
    expect(groups.map((g) => `${g.target_type}:${g.target_id}:${g.reports.length}`)).toEqual([
      'post:a:2',
      'paper:b:1',
      'comment:c:1',
    ]);
    expect(groups[0].firstReportedAt).toBe('2026-01-02');
  });
});
