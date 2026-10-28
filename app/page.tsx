import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { PaperCard, type PaperCardData } from '@/components/PaperCard';
import { EmptyState } from '@/components/EmptyState';
import { CATEGORY_LABELS } from '@/lib/board';
import { excerpt, formatDate } from '@/lib/format';
import type { BoardCategory } from '@/lib/types';

const PAPER_FIELDS = 'concept_id, version_no, title, authors, abstract, tags, school, view_count, created_at, status';

// Shown in the hero "product shot" until real papers exist.
const SAMPLE_PAPERS: PaperCardData[] = [
  {
    concept_id: 'KSCA-2026-000001',
    version_no: 2,
    title: '청소년을 위한 강화학습 입문 실험',
    authors: '김민준',
    abstract: '그리드월드 환경에서 Q-learning 에이전트의 수렴 과정을 관찰하고, 탐험 비율 감쇠 전략의 효과를 검증했다.',
    tags: ['AI'],
    school: null,
    view_count: 0,
    created_at: '2026-04-02T00:00:00Z',
    status: 'public',
  },
  {
    concept_id: 'KSCA-2026-000002',
    version_no: 1,
    title: '학교 급식 데이터로 보는 영양 불균형 분석',
    authors: '이서연',
    abstract: '전국 20개교의 급식 식단 데이터를 수집해 끼니별 영양소 편차를 분석했다.',
    tags: ['데이터분석'],
    school: null,
    view_count: 0,
    created_at: '2026-05-20T00:00:00Z',
    status: 'public',
  },
  {
    concept_id: 'KSCA-2026-000003',
    version_no: 1,
    title: '한국어 맞춤법 교정을 위한 경량 트랜스포머',
    authors: '박지호, 최유나',
    abstract: '노트북 CPU에서도 실시간으로 동작하는 한국어 맞춤법 교정 모델을 설계했다.',
    tags: ['NLP'],
    school: null,
    view_count: 0,
    created_at: '2026-06-11T00:00:00Z',
    status: 'public',
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
  const [{ data: latest }, { count: paperCount }, { count: postCount }, { data: notices }, { data: posts }] = await Promise.all([
    supabase.from('latest_papers').select(PAPER_FIELDS).eq('status', 'public').order('created_at', { ascending: false }).limit(8),
    supabase.from('latest_papers').select('id', { count: 'exact', head: true }).eq('status', 'public'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'public'),
    supabase.from('posts').select('id, title').eq('category', 'notice').eq('status', 'public').order('created_at', { ascending: false }).limit(1),
    supabase
      .from('posts')
      .select('id, title, category, created_at')
      .neq('category', 'notice')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const papers = (latest ?? []) as PaperCardData[];
  const heroPapers = papers.length >= 3 ? papers.slice(0, 3) : [...papers, ...SAMPLE_PAPERS].slice(0, 3);
  const showcaseId = papers[0]?.concept_id ?? `KSCA-${new Date().getFullYear()}-000001`;
  const notice = notices?.[0];

  return (
    <>
      {notice && (
        <div className="bg-surface px-5 py-3 text-center text-[14px]">
          <Link href={`/board/post/${notice.id}`} className="link-chevron">
            <span className="text-foreground">공지</span>&nbsp;{notice.title}
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-16 text-center sm:pt-24">
        <Container>
          <p className="eyebrow text-muted-foreground">KSCA · 전국 청소년 컴퓨터 사이언스 학회</p>
          <h1 className="headline-hero mt-4">student&apos;s academia.</h1>
          <p className="subhead mx-auto mt-6 max-w-xl text-muted-foreground">청소년의 연구가 기록되고, 인용되는 곳.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/papers" className={buttonVariants({ size: 'lg' })}>
              아카이브 둘러보기
            </Link>
            <Link href="/papers/upload" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              논문 업로드
            </Link>
          </div>
        </Container>
        <HeroStack papers={heroPapers} />
      </section>

      {/* Permanent identifier */}
      <section className="bg-black py-24 text-center text-white sm:py-32">
        <Container>
          <p className="eyebrow text-[#86868b]">영구 식별자</p>
          <h2 className="headline-xl mt-4">
            한 번 올리면,
            <br />
            영원히 인용됩니다.
          </h2>
          <p className="text-gradient-blue mt-12 font-mono text-[clamp(30px,7.5vw,84px)] leading-none font-semibold tracking-[-0.04em]">
            {showcaseId}
          </p>
          <p className="subhead mx-auto mt-10 max-w-2xl text-[#a1a1a6]">
            업로드하는 순간 학회 통합 일련번호가 발급되고, APA와 BibTeX 인용문이 자동으로 만들어집니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[17px]">
            <Link href="/papers" className="link-chevron !text-[#2997ff]">
              아카이브 살펴보기
            </Link>
            <Link href="/papers/upload" className="link-chevron !text-[#2997ff]">
              지금 업로드하기
            </Link>
          </div>
        </Container>
      </section>

      {/* Bento */}
      <section className="mx-auto mt-3 grid max-w-[1200px] gap-3 px-3 md:grid-cols-2">
        <div className="flex min-w-0 flex-col items-center overflow-hidden rounded-[28px] bg-surface px-6 pt-14 pb-12 text-center sm:px-12">
          <p className="eyebrow text-muted-foreground">버전 관리</p>
          <h2 className="headline-md mt-3">
            고쳐 올려도,
            <br />
            주소는 그대로.
          </h2>
          <p className="mt-4 max-w-sm text-[17px] text-muted-foreground">
            새 버전을 올려도 식별자는 유지되고, 이전 버전과 그때 받은 댓글도 모두 남아요.
          </p>
          <div className="mt-12 flex items-center gap-2" aria-hidden>
            {[1, 2, 3].map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span
                  className={
                    v === 3
                      ? 'rounded-full bg-primary px-4 py-2 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,113,227,0.35)] sm:px-5 sm:py-2.5 sm:text-[17px]'
                      : 'rounded-full bg-white px-4 py-2 text-[15px] font-semibold text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:px-5 sm:py-2.5 sm:text-[17px]'
                  }
                >
                  v{v}
                </span>
                {v < 3 && <span className="h-px w-4 bg-hairline sm:w-10" />}
              </div>
            ))}
          </div>
          <div className="mt-8 w-full max-w-sm rounded-2xl bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)]" aria-hidden>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-semibold">이서연</span>
              <span className="rounded-full bg-[#e8f1fc] px-2 py-0.5 text-[11px] font-semibold text-link">v1에 작성됨</span>
            </div>
            <p className="mt-1 text-[14px] text-ink-2">흥미로운 접근이네요! 보상 함수는 어떻게 설계하셨나요?</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center overflow-hidden rounded-[28px] bg-[#fbfbfd] px-6 pt-14 pb-12 text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] sm:px-12">
          <p className="eyebrow text-muted-foreground">자율 운영</p>
          <h2 className="headline-md mt-3">
            승인은 없이.
            <br />
            책임은 함께.
          </h2>
          <p className="mt-4 max-w-sm text-[17px] text-muted-foreground">
            사전 승인 없이 바로 게시되고, 신고가 3건 쌓이면 자동으로 비공개돼요. 최종 판단은 운영진이 합니다.
          </p>
          <div className="mt-12 flex items-center gap-2 sm:gap-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="grid size-11 place-items-center rounded-full bg-gradient-to-b from-[#ff9f0a] to-[#ff6b00] text-[18px] font-bold text-white shadow-[0_8px_20px_rgba(255,120,0,0.3)] sm:size-14 sm:text-[22px]"
              >
                {i + 1}
              </span>
            ))}
            <span className="text-[22px] text-hairline sm:text-[28px]">→</span>
            <span className="rounded-full bg-[#1d1d1f] px-4 py-2.5 text-[14px] font-semibold text-white sm:px-5 sm:py-3 sm:text-[15px]">비공개</span>
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground">표절 의심 · 부적절한 내용 · 스팸 · 기타</p>
        </div>

        <div className="grid min-w-0 items-center gap-10 rounded-[28px] bg-surface px-6 py-14 sm:px-14 md:col-span-2 md:grid-cols-[1fr_1.1fr]">
          <div className="text-center md:text-left">
            <p className="eyebrow text-muted-foreground">커뮤니티</p>
            <h2 className="headline-md mt-3">
              혼자 하는 연구는
              <br />
              없으니까.
            </h2>
            <p className="mt-4 text-[17px] text-muted-foreground">막히는 코드는 질문하고, 함께할 스터디원은 모집하고, 연구 이야기는 자유롭게.</p>
            <Link href="/board" className="link-chevron mt-6 text-[17px]">
              커뮤니티 가기
            </Link>
          </div>
          <ul className="space-y-2.5">
            {(posts ?? []).length === 0 ? (
              <li className="rounded-2xl bg-white px-5 py-4 text-[15px] text-muted-foreground">아직 게시글이 없어요. 첫 글을 남겨보세요.</li>
            ) : (
              (posts ?? []).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/board/post/${p.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-link">{CATEGORY_LABELS[p.category as BoardCategory]}</span>
                      <span className="block truncate text-[16px] font-semibold tracking-[-0.015em]">{p.title}</span>
                    </span>
                    <time dateTime={p.created_at} className="shrink-0 text-[12px] text-muted-foreground">
                      {formatDate(p.created_at)}
                    </time>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Latest papers carousel */}
      <section className="pt-24 sm:pt-32" aria-labelledby="latest-heading">
        <Container>
          <h2 id="latest-heading" className="text-[28px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]">
            신규 논문. <span className="text-muted-foreground">지금 막 기록된 연구들.</span>
          </h2>
        </Container>
        {papers.length === 0 ? (
          <Container className="mt-8">
            <EmptyState
              title="첫 번째 논문의 주인공이 되어보세요"
              message="아직 등록된 논문이 없어요."
              actionLabel="논문 업로드하기"
              actionHref="/papers/upload"
            />
          </Container>
        ) : (
          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-6 sm:scroll-px-6 sm:px-6 lg:scroll-px-[calc((100vw-1024px)/2+24px)] lg:px-[calc((100vw-1024px)/2+24px)]">
            {papers.map((p) => (
              <div key={p.concept_id} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
                <PaperCard paper={p} />
              </div>
            ))}
            <Link
              href="/papers"
              className="flex w-[200px] shrink-0 snap-start flex-col items-center justify-center rounded-[22px] bg-surface text-center text-[17px] font-semibold transition hover:bg-[#e8e8ed]"
            >
              <span className="grid size-12 place-items-center rounded-full bg-white text-[22px] text-link shadow-[0_1px_3px_rgba(0,0,0,0.08)]">›</span>
              <span className="mt-3">전체 보기</span>
            </Link>
          </div>
        )}
      </section>

      {/* Closing CTA */}
      <section className="pt-24 text-center sm:pt-32">
        <Container>
          <h2 className="headline-xl">
            당신의 연구를
            <br />
            기록할 차례.
          </h2>
          <p className="subhead mx-auto mt-5 max-w-xl text-muted-foreground">학교 인증 없이, 전국 청소년 누구나.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
              지금 가입하기
            </Link>
            <Link href="/papers/upload" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              논문 업로드
            </Link>
          </div>
          <dl className="mx-auto mt-16 grid max-w-md grid-cols-2 divide-x divide-hairline">
            <div>
              <dt className="text-[13px] text-muted-foreground">등록된 논문</dt>
              <dd className="mt-1 text-[40px] font-bold tracking-[-0.03em] tabular-nums">{(paperCount ?? 0).toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted-foreground">커뮤니티 글</dt>
              <dd className="mt-1 text-[40px] font-bold tracking-[-0.03em] tabular-nums">{(postCount ?? 0).toLocaleString('ko-KR')}</dd>
            </div>
          </dl>
        </Container>
      </section>
    </>
  );
}

// The hero "product shot": three real (or sample) papers fanned like
// printed pages, cropped by the section edge, over a soft color glow.
function HeroStack({ papers }: { papers: PaperCardData[] }) {
  const layout = [
    { transform: 'translateX(calc(-50% - 250px)) translateY(56px) rotate(-8deg)', z: 'z-10', hide: 'hidden md:block' },
    { transform: 'translateX(calc(-50% + 250px)) translateY(56px) rotate(8deg)', z: 'z-10', hide: 'hidden md:block' },
    { transform: 'translateX(-50%)', z: 'z-20', hide: '' },
  ];
  const order = [papers[1], papers[2], papers[0]];
  return (
    <div className="relative mx-auto mt-16 h-[400px] max-w-[1200px] sm:mt-20 sm:h-[470px]" aria-hidden>
      <div className="absolute top-24 left-1/2 h-[380px] w-[760px] max-w-[95vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(41,151,255,0.28),rgba(168,85,247,0.16)_55%,transparent)] blur-2xl" />
      {order.map((p, i) =>
        p ? (
          <div key={`${p.concept_id}-${i}`} className={`absolute top-0 left-1/2 ${layout[i].z} ${layout[i].hide}`} style={{ transform: layout[i].transform }}>
            <div className="relative h-[440px] w-[300px] rounded-[26px] bg-white p-7 text-left shadow-[0_50px_100px_-30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.05)] sm:w-[340px]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="font-mono tracking-normal">{p.concept_id}</span>
                <span>v{p.version_no}</span>
              </div>
              <div className="mt-7 h-1 w-10 rounded-full bg-primary" />
              <h3 className="mt-4 line-clamp-3 text-[22px] leading-[1.25] font-bold tracking-[-0.025em]">{p.title}</h3>
              <p className="mt-2 text-[13px] text-muted-foreground">{p.authors}</p>
              <p className="mt-5 line-clamp-4 text-[13px] leading-[1.6] text-ink-2">{excerpt(p.abstract, 160)}</p>
              <div className="mt-6 space-y-2.5">
                {[100, 94, 97, 72].map((w, j) => (
                  <div key={j} className="h-[7px] rounded-full bg-[#f0f0f3]" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        ) : null
      )}
      <div className="absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
