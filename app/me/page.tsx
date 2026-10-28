import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { loginHref } from '@/lib/paths';
import { formatDate } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/board';
import { TARGET_LABELS } from '@/lib/moderation';
import { REPORT_REASONS, isValidReportReason } from '@/lib/validation';
import { resolveTargets, targetKey } from '@/lib/targets';
import { PageHeader } from '@/components/PageHeader';
import { ProfileForm } from '@/components/AuthForms';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import type { BoardCategory, ContentStatus, ReportStatus, TargetType } from '@/lib/types';

export const metadata: Metadata = { title: '마이페이지' };

export default async function MePage() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect(loginHref('/me'));
  const userId = viewer.user.id;

  const [{ data: paperRows }, { data: posts }, { data: reports }] = await Promise.all([
    supabase
      .from('papers')
      .select('id, concept_id, version_no, title, status, view_count, created_at')
      .eq('author_id', userId)
      .order('version_no', { ascending: false }),
    supabase
      .from('posts')
      .select('id, title, category, status, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reports')
      .select('id, target_type, target_id, reason, status, created_at')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  // One row per paper (its latest version) with the version count.
  type PaperRow = { id: string; concept_id: string; version_no: number; title: string; status: ContentStatus; view_count: number; created_at: string };
  const papers = new Map<string, PaperRow & { versions: number }>();
  for (const p of (paperRows ?? []) as PaperRow[]) {
    const seen = papers.get(p.concept_id);
    if (seen) seen.versions += 1;
    else papers.set(p.concept_id, { ...p, versions: 1 });
  }

  type ReportRow = { id: string; target_type: TargetType; target_id: string; reason: string; status: ReportStatus; created_at: string };
  const reportList = (reports ?? []) as ReportRow[];
  const targets = await resolveTargets(supabase, reportList);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={viewer.user.email}
        title={`${viewer.profile.nickname}님의 페이지`}
        description={viewer.profile.role === 'admin' ? '운영진 계정입니다.' : undefined}
      />

      <section aria-labelledby="profile-heading" className="rounded-xl border bg-card p-5">
        <h2 id="profile-heading" className="mb-4 text-lg font-bold">
          프로필
        </h2>
        <ProfileForm nickname={viewer.profile.nickname} school={viewer.profile.school} />
      </section>

      <section aria-labelledby="my-papers-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="my-papers-heading" className="text-lg font-bold">
            내 논문 <span className="text-muted-foreground">{papers.size}</span>
          </h2>
          <Link href="/papers/upload" className="text-sm font-medium text-primary hover:underline">
            새 논문 업로드
          </Link>
        </div>
        {papers.size === 0 ? (
          <EmptyState message="업로드한 논문이 없습니다." actionLabel="첫 논문 업로드하기" actionHref="/papers/upload" />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {[...papers.values()].map((p) => (
              <li key={p.concept_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <Link href={`/papers/${p.concept_id}`} className="font-medium hover:text-primary">
                  {p.title}
                </Link>
                <StatusBadge status={p.status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {p.concept_id} · v{p.version_no}
                  {p.versions > 1 ? ` (${p.versions}개 버전)` : ''}
                </span>
                <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  <span>조회 {p.view_count.toLocaleString('ko-KR')}</span>
                  <Link href={`/papers/${p.concept_id}/upload-version`} className="text-primary hover:underline">
                    새 버전
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-posts-heading">
        <h2 id="my-posts-heading" className="mb-3 text-lg font-bold">
          내 글 <span className="text-muted-foreground">{posts?.length ?? 0}</span>
        </h2>
        {!posts || posts.length === 0 ? (
          <EmptyState message="작성한 글이 없습니다." actionLabel="글쓰기" actionHref="/board/write" />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.7rem] text-secondary-foreground">
                  {CATEGORY_LABELS[p.category as BoardCategory]}
                </span>
                <Link href={`/board/post/${p.id}`} className="font-medium hover:text-primary">
                  {p.title}
                </Link>
                <StatusBadge status={p.status as ContentStatus} />
                <time dateTime={p.created_at} className="ml-auto text-xs text-muted-foreground">
                  {formatDate(p.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-reports-heading">
        <h2 id="my-reports-heading" className="text-lg font-bold">
          내 신고 내역 <span className="text-muted-foreground">{reportList.length}</span>
        </h2>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">신고 대상과 처리 여부만 표시됩니다.</p>
        {reportList.length === 0 ? (
          <EmptyState message="신고 내역이 없습니다." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {reportList.map((r) => {
              const target = targets.get(targetKey(r));
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
                    {TARGET_LABELS[r.target_type]}
                  </span>
                  {target ? (
                    <Link href={target.href} className="hover:text-primary">
                      {target.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">비공개 처리된 콘텐츠</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {isValidReportReason(r.reason) ? REPORT_REASONS[r.reason] : r.reason}
                  </span>
                  <span className="ml-auto flex items-center gap-3 text-xs">
                    <span
                      className={
                        r.status === 'pending'
                          ? 'rounded-full bg-accent px-2 py-0.5 text-accent-foreground'
                          : 'rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground'
                      }
                    >
                      {r.status === 'pending' ? '검토 대기' : '검토 완료'}
                    </span>
                    <time dateTime={r.created_at} className="text-muted-foreground">
                      {formatDate(r.created_at)}
                    </time>
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
