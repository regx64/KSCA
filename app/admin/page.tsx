import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flag, Megaphone } from 'lucide-react';
import { requireAdminPage } from '@/lib/guards';
import { TABLE_BY_TARGET, TARGET_LABELS } from '@/lib/moderation';
import { resolveTargets, targetKey } from '@/lib/targets';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import { EmptyState } from '@/components/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import type { TargetType } from '@/lib/types';

export const metadata: Metadata = { title: '운영진 대시보드' };

const TARGETS = Object.keys(TABLE_BY_TARGET) as TargetType[];

export default async function AdminHomePage() {
  const { supabase } = await requireAdminPage('/admin');

  const count = (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return q.then(({ count: c }) => c ?? 0);
  };

  const [pendingReports, users, papers, posts, hiddenCounts, hiddenRows] = await Promise.all([
    supabase.from('reports').select('target_type, target_id').eq('status', 'pending'),
    count('profiles'),
    count('latest_papers'),
    count('posts'),
    Promise.all(TARGETS.map((t) => count(TABLE_BY_TARGET[t], ['status', 'hidden']))),
    Promise.all(
      TARGETS.map((t) =>
        supabase
          .from(TABLE_BY_TARGET[t])
          .select('id, created_at')
          .eq('status', 'hidden')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => (data ?? []).map((r) => ({ target_type: t, target_id: r.id as string, created_at: r.created_at as string })))
      )
    ),
  ]);

  const pendingTargets = new Set((pendingReports.data ?? []).map((r) => `${r.target_type}:${r.target_id}`));
  const hidden = hiddenRows.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const targets = await resolveTargets(supabase, hidden);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="ADMIN" title="운영진 대시보드" description="신고 검토, 비공개 콘텐츠 관리, 공지 작성을 할 수 있습니다." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/reports" className="group rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <Flag className="size-5 text-destructive" aria-hidden />
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
          </div>
          <p className="mt-3 font-semibold">신고 검토 큐</p>
          <p className="mt-1 text-sm text-muted-foreground">
            검토 대기 <strong className="text-foreground">{pendingTargets.size}</strong>건 (신고 {(pendingReports.data ?? []).length}개)
          </p>
        </Link>
        <Link
          href="/board/write?category=notice"
          className="group rounded-xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Megaphone className="size-5 text-primary" aria-hidden />
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
          </div>
          <p className="mt-3 font-semibold">공지 작성</p>
          <p className="mt-1 text-sm text-muted-foreground">공지 카테고리는 운영진만 작성할 수 있습니다.</p>
        </Link>
      </div>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="mb-3 text-lg font-bold">
          현황
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['회원', users],
            ['논문', papers],
            ['게시글', posts],
            ['비공개 콘텐츠', hiddenCounts.reduce((a, b) => a + b, 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-heading text-2xl font-bold">{Number(value).toLocaleString('ko-KR')}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          비공개 내역: {TARGETS.map((t, i) => `${TARGET_LABELS[t]} ${hiddenCounts[i]}`).join(' · ')}
        </p>
      </section>

      <section aria-labelledby="hidden-heading">
        <h2 id="hidden-heading" className="text-lg font-bold">
          최근 비공개 콘텐츠
        </h2>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
          신고 누적 또는 운영진 조치로 비공개된 콘텐츠입니다. 검토 대기 중인 항목은 신고 검토 큐에서 처리하세요.
        </p>
        {hidden.length === 0 ? (
          <EmptyState message="비공개 콘텐츠가 없습니다." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {hidden.map((h) => {
              const t = targets.get(targetKey(h));
              const pending = pendingTargets.has(targetKey(h));
              return (
                <li key={targetKey(h)} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
                    {TARGET_LABELS[h.target_type]}
                  </span>
                  {t ? (
                    <Link href={t.href} className="min-w-0 truncate font-medium hover:text-primary">
                      {t.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">(삭제된 대상)</span>
                  )}
                  {t && <span className="text-xs text-muted-foreground">{t.authorNickname}</span>}
                  <span className="text-xs text-muted-foreground">{formatDate(h.created_at)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {pending ? (
                      <Link href="/admin/reports" className={buttonVariants({ variant: 'outline', size: 'xs' })}>
                        검토 대기 중
                      </Link>
                    ) : (
                      <AdminModerationButtons targetType={h.target_type} targetId={h.target_id} status="hidden" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
