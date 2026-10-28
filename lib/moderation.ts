// Report review logic (README §11). Pure helpers plus `applyResolution`,
// which takes the Supabase client as a parameter so the dispatch (which table,
// which status) is unit-testable; the admin Server Action wraps it.
import type { ContentStatus, Report, TargetType } from '@/lib/types';

export const TABLE_BY_TARGET = {
  paper: 'papers',
  post: 'posts',
  comment: 'comments',
  paper_comment: 'paper_comments',
} as const satisfies Record<TargetType, string>;

export const TARGET_LABELS: Record<TargetType, string> = {
  paper: '논문',
  post: '게시글',
  comment: '게시판 댓글',
  paper_comment: '논문 댓글',
};

// 삭제 확정 = keep hidden; 복구 = back to public. Both close the reports.
export type Decision = 'confirm' | 'restore';

export function statusForDecision(decision: Decision): ContentStatus {
  return decision === 'confirm' ? 'hidden' : 'public';
}

export function isDecision(x: string): x is Decision {
  return x === 'confirm' || x === 'restore';
}

export type ReportGroup<R> = {
  target_type: TargetType;
  target_id: string;
  reports: R[];
  firstReportedAt: string;
};

// Groups pending reports per target so admins resolve once per item, not once
// per report. Most-reported first, then oldest first.
export function groupReportsByTarget<R extends Pick<Report, 'target_type' | 'target_id' | 'created_at'>>(
  reports: R[]
): ReportGroup<R>[] {
  const groups = new Map<string, ReportGroup<R>>();
  for (const r of reports) {
    const key = `${r.target_type}:${r.target_id}`;
    let g = groups.get(key);
    if (!g) {
      g = { target_type: r.target_type, target_id: r.target_id, reports: [], firstReportedAt: r.created_at };
      groups.set(key, g);
    }
    g.reports.push(r);
    if (r.created_at < g.firstReportedAt) g.firstReportedAt = r.created_at;
  }
  return [...groups.values()].sort(
    (a, b) => b.reports.length - a.reports.length || a.firstReportedAt.localeCompare(b.firstReportedAt)
  );
}

// Typed loosely so both the real SupabaseClient and a recording test stub fit.
export type ModerationClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

// Sets the content's status and marks every *pending* report on that target
// reviewed — not just one row — so the other reports that tripped the
// threshold don't keep resurfacing in the queue.
export async function applyResolution(
  supabase: ModerationClient,
  targetType: TargetType,
  targetId: string,
  decision: Decision
): Promise<{ error: { code?: string; message?: string } | null }> {
  const { error: contentError } = await supabase
    .from(TABLE_BY_TARGET[targetType])
    .update({ status: statusForDecision(decision) })
    .eq('id', targetId);
  if (contentError) return { error: contentError };

  const { error: reportError } = await supabase
    .from('reports')
    .update({ status: 'reviewed' })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('status', 'pending');
  return { error: reportError };
}
