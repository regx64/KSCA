import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Fingerprint, GitBranch, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { PaperCard, type PaperCardData } from '@/components/PaperCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/format';

const HIGHLIGHT_COUNT = 4;

const FEATURES = [
  {
    icon: Fingerprint,
    title: '영구 식별자',
    body: '업로드하는 순간 KSCA-연도-일련번호 형식의 식별자가 발급되어, 언제든 같은 주소로 인용할 수 있어요.',
  },
  {
    icon: GitBranch,
    title: '버전 관리',
    body: '연구를 고쳐 새 버전을 올려도 식별자는 그대로. 이전 버전과 그때 받은 댓글도 모두 남아요.',
  },
  {
    icon: ShieldCheck,
    title: '신고 기반 자율 운영',
    body: '사전 승인 없이 바로 공유하고, 문제가 되는 콘텐츠는 신고 3건이 쌓이면 자동으로 비공개돼요.',
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Supabase Auth falls back to the Site URL (this page) when an email link
  // fails, e.g. ?error=access_denied&error_code=otp_expired.
  const sp = await searchParams;
  if (sp.error_code || sp.error) redirect('/login?error=confirm');

  const supabase = await createClient();
  const [{ data: highlights }, { count: paperCount }, { count: postCount }, { data: notices }] = await Promise.all([
    supabase
      .from('latest_papers')
      .select('concept_id, version_no, title, authors, abstract, tags, school, view_count, created_at, status')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(HIGHLIGHT_COUNT),
    supabase.from('latest_papers').select('id', { count: 'exact', head: true }).eq('status', 'public'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'public'),
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('category', 'notice')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-12 shadow-xs sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/60 blur-3xl"
        />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-secondary blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Korea Student Computer science Association</p>
          <h1 className="mt-4 text-3xl leading-tight font-bold sm:text-5xl sm:leading-tight">
            청소년의 연구가
            <br />
            기록되고, 인용되는 곳
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            KSCA는 전국 청소년 누구나 컴퓨터 사이언스 연구와 프로젝트를 공유하는 학회입니다. 학교 인증 없이 올리고,
            영구 식별자로 인용하고, 함께 토론하세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/papers/upload" className={buttonVariants({ size: 'lg' })}>
              논문 업로드
              <ArrowRight aria-hidden />
            </Link>
            <Link href="/papers" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              아카이브 둘러보기
            </Link>
          </div>
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="text-xs text-muted-foreground">등록된 논문</dt>
              <dd className="font-heading text-2xl font-bold">{(paperCount ?? 0).toLocaleString('ko-KR')}편</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">커뮤니티 글</dt>
              <dd className="font-heading text-2xl font-bold">{(postCount ?? 0).toLocaleString('ko-KR')}개</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          KSCA의 특징
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="new-papers-heading">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 id="new-papers-heading" className="text-2xl font-bold">
              신규 논문
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">가장 최근에 올라온 연구들</p>
          </div>
          <Link href="/papers" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            전체 보기
          </Link>
        </div>
        {!highlights || highlights.length === 0 ? (
          <EmptyState
            title="아직 등록된 논문이 없어요"
            message="첫 번째 연구를 공유해 보세요."
            actionLabel="첫 논문 업로드하기"
            actionHref="/papers/upload"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(highlights as PaperCardData[]).map((p) => (
              <PaperCard key={p.concept_id} paper={p} />
            ))}
          </div>
        )}
      </section>

      {notices && notices.length > 0 && (
        <section aria-labelledby="notices-heading" className="rounded-xl border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="notices-heading" className="text-lg font-bold">
              공지사항
            </h2>
            <Link href="/board/notice" className="text-sm text-primary underline-offset-4 hover:underline">
              더 보기
            </Link>
          </div>
          <ul className="divide-y">
            {notices.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <Link href={`/board/post/${n.id}`} className="truncate hover:text-primary">
                  {n.title}
                </Link>
                <time dateTime={n.created_at} className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(n.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
