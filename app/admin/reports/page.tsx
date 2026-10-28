import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/guards';
import { TARGET_LABELS, groupReportsByTarget } from '@/lib/moderation';
import { resolveTargets, targetKey } from '@/lib/targets';
import { REPORT_REASONS, isValidReportReason } from '@/lib/validation';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Container } from '@/components/Container';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import type { ReportStatus, TargetType } from '@/lib/types';

export const metadata: Metadata = { title: '신고 검토 큐' };

type ReportRow = {
  id: string;
  target_type: TargetType;
  target_id: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  created_at: string;
  profiles: { nickname: string } | { nickname: string }[] | null;
};

const reasonLabel = (r: string) => (isValidReportReason(r) ? REPORT_REASONS[r] : r);
const reporterOf = (p: ReportRow['profiles']) => (Array.isArray(p) ? p[0] : p)?.nickname ?? '알 수 없음';

// README §11: grouped per reported item; 삭제 확정 keeps it hidden, 복구 makes
// it public again — both mark every pending report on the item reviewed.
export default async function AdminReportsPage() {
  const { supabase } = await requireAdminPage('/admin/reports');

  const select = 'id, target_type, target_id, reason, detail, status, created_at, profiles(nickname)';
  const [{ data: pending }, { data: reviewed }] = await Promise.all([
    supabase.from('reports').select(select).eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('reports').select(select).eq('status', 'reviewed').order('created_at', { ascending: false }).limit(60),
  ]);
  const queue = groupReportsByTarget((pending ?? []) as ReportRow[]);
  const history = groupReportsByTarget((reviewed ?? []) as ReportRow[]).slice(0, 15);
  const targets = await resolveTargets(supabase, [...queue, ...history]);

  return (
    <Container>
      <PageHeader
        eyebrow={
          <Link href="/admin" className="text-link hover:underline">
            운영진 대시보드
          </Link>
        }
        title="신고 검토 큐."
        description="같은 대상에 대한 신고는 묶어서 표시됩니다. 신고 3건이 누적된 콘텐츠는 이미 자동으로 비공개 상태입니다."
      />

      <section aria-labelledby="queue-heading">
        <h2 id="queue-heading" className="headline-md mb-6">
          검토 대기 <span className="text-muted-foreground">{queue.length}</span>
        </h2>
        {queue.length === 0 ? (
          <EmptyState title="대기 중인 신고가 없습니다" message="모든 신고를 처리했어요." />
        ) : (
          <ul className="space-y-3">
            {queue.map((g) => {
              const t = targets.get(targetKey(g));
              return (
                <li key={targetKey(g)} className="rounded-[22px] bg-surface p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                        <span className="text-muted-foreground">{TARGET_LABELS[g.target_type]}</span>
                        {t && <StatusBadge status={t.status} />}
                        <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-[#b25000]">신고 {g.reports.length}건</span>
                      </div>
                      {t ? (
                        <>
                          <Link href={t.href} className="mt-2 block text-[21px] font-bold tracking-[-0.02em] hover:text-link">
                            {t.title}
                          </Link>
                          <p className="mt-1 text-[13px] text-muted-foreground">작성자 {t.authorNickname}</p>
                          {t.preview && (
                            <p className="mt-4 line-clamp-3 rounded-2xl bg-white p-4 text-[14px] leading-relaxed whitespace-pre-wrap text-ink-2">{t.preview}</p>
                          )}
                        </>
                      ) : (
                        <p className="mt-2 text-[15px] text-muted-foreground">대상을 찾을 수 없습니다 ({g.target_id})</p>
                      )}
                    </div>
                    <AdminModerationButtons targetType={g.target_type} targetId={g.target_id} status={t?.status ?? 'hidden'} mode="queue" />
                  </div>
                  <ul className="mt-6 space-y-2 border-t border-border pt-5 text-[14px]">
                    {g.reports.map((r) => (
                      <li key={r.id} className="flex flex-wrap gap-x-2">
                        <span className="font-semibold">{reporterOf(r.profiles)}</span>
                        <span className="text-link">{reasonLabel(r.reason)}</span>
                        {r.detail && <span className="text-muted-foreground">— {r.detail}</span>}
                        <time dateTime={r.created_at} className="ml-auto text-[12px] text-muted-foreground">
                          {formatDateTime(r.created_at)}
                        </time>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-heading" className="mt-16">
        <h2 id="history-heading" className="headline-md mb-6">
          최근 처리 내역.
        </h2>
        {history.length === 0 ? (
          <EmptyState message="처리한 신고가 없습니다." />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {history.map((g) => {
              const t = targets.get(targetKey(g));
              return (
                <li key={targetKey(g)} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4 text-[15px]">
                  <span className="text-[12px] font-semibold text-muted-foreground">{TARGET_LABELS[g.target_type]}</span>
                  {t ? (
                    <Link href={t.href} className="min-w-0 truncate font-semibold hover:text-link">
                      {t.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">(삭제된 대상)</span>
                  )}
                  <span className="text-[13px] text-muted-foreground">신고 {g.reports.length}건</span>
                  <span className="ml-auto text-[13px] font-semibold">
                    {t?.status === 'hidden' ? <span className="text-destructive">삭제 확정</span> : <span className="text-[#1a7f37]">복구됨</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Container>
  );
}
