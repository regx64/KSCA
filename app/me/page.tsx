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
import { Container } from '@/components/Container';
import { buttonVariants } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
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
    <Container>
      <div className="flex flex-col gap-6 pt-14 pb-12 sm:flex-row sm:items-end sm:justify-between sm:pt-20">
        <div>
          <p className="eyebrow text-muted-foreground">
            {viewer.user.email}
            {viewer.profile.role === 'admin' && <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[11px] text-white">운영진</span>}
          </p>
          <h1 className="headline-lg mt-3">안녕하세요, {viewer.profile.nickname}님.</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className={buttonVariants({ variant: 'secondary' })}>
            로그아웃
          </button>
        </form>
      </div>

      <div className="space-y-16">
        <section aria-labelledby="profile-heading" className="rounded-[28px] bg-surface p-7 sm:p-10">
          <h2 id="profile-heading" className="headline-md mb-6">
            프로필.
          </h2>
          <ProfileForm nickname={viewer.profile.nickname} school={viewer.profile.school} />
        </section>

        <section aria-labelledby="my-papers-heading">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="my-papers-heading" className="headline-md">
              내 논문 <span className="text-muted-foreground">{papers.size}</span>
            </h2>
            <Link href="/papers/upload" className="link-chevron text-[15px]">
              새 논문 업로드
            </Link>
          </div>
          {papers.size === 0 ? (
            <EmptyState message="업로드한 논문이 없습니다." actionLabel="첫 논문 업로드하기" actionHref="/papers/upload" />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {[...papers.values()].map((p) => (
                <li key={p.concept_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-muted-foreground">
                      <span className="font-mono tracking-normal">{p.concept_id}</span> · v{p.version_no}
                      {p.versions > 1 ? ` · ${p.versions}개 버전` : ''}
                    </p>
                    <Link href={`/papers/${p.concept_id}`} className="mt-1 inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] hover:text-link">
                      {p.title}
                      <StatusBadge status={p.status} />
                    </Link>
                  </div>
                  <span className="flex items-center gap-5 text-[13px] text-muted-foreground">
                    <span className="tabular-nums">조회 {p.view_count.toLocaleString('ko-KR')}</span>
                    <Link href={`/papers/${p.concept_id}/upload-version`} className="link-chevron">
                      새 버전
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="my-posts-heading">
          <h2 id="my-posts-heading" className="headline-md mb-6">
            내 글 <span className="text-muted-foreground">{posts?.length ?? 0}</span>
          </h2>
          {!posts || posts.length === 0 ? (
            <EmptyState message="작성한 글이 없습니다." actionLabel="글쓰기" actionHref="/board/write" />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4">
                  <span className="text-[12px] font-semibold text-link">{CATEGORY_LABELS[p.category as BoardCategory]}</span>
                  <Link href={`/board/post/${p.id}`} className="text-[16px] font-semibold hover:text-link">
                    {p.title}
                  </Link>
                  <StatusBadge status={p.status as ContentStatus} />
                  <time dateTime={p.created_at} className="ml-auto text-[13px] text-muted-foreground">
                    {formatDate(p.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="my-reports-heading">
          <h2 id="my-reports-heading" className="headline-md">
            내 신고 내역 <span className="text-muted-foreground">{reportList.length}</span>
          </h2>
          <p className="mt-2 mb-6 text-[14px] text-muted-foreground">신고 대상과 처리 여부만 표시됩니다.</p>
          {reportList.length === 0 ? (
            <EmptyState message="신고 내역이 없습니다." />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {reportList.map((r) => {
                const target = targets.get(targetKey(r));
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4 text-[15px]">
                    <span className="text-[12px] font-semibold text-muted-foreground">{TARGET_LABELS[r.target_type]}</span>
                    {target ? (
                      <Link href={target.href} className="font-semibold hover:text-link">
                        {target.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">비공개 처리된 콘텐츠</span>
                    )}
                    <span className="text-[13px] text-muted-foreground">{isValidReportReason(r.reason) ? REPORT_REASONS[r.reason] : r.reason}</span>
                    <span className="ml-auto flex items-center gap-3 text-[12px]">
                      <span
                        className={
                          r.status === 'pending'
                            ? 'rounded-full bg-[#fff4e5] px-2.5 py-0.5 font-semibold text-[#b25000]'
                            : 'rounded-full bg-[#e8f8ee] px-2.5 py-0.5 font-semibold text-[#1a7f37]'
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
    </Container>
  );
}
