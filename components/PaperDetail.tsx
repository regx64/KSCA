import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { getPaperVersions } from '@/lib/papers';
import { canView } from '@/lib/visibility';
import { toThreadComments } from '@/lib/comments';
import { formatDate } from '@/lib/format';
import { getSiteUrl } from '@/lib/site';
import { addPaperComment } from '@/lib/actions/comments';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/Container';
import { LocalNav } from '@/components/LocalNav';
import { CitationBlock } from '@/components/CitationBlock';
import { CommentThread } from '@/components/CommentThread';
import { CommentForm } from '@/components/CommentForm';
import { ReportButton } from '@/components/ReportButton';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import { HiddenNotice } from '@/components/HiddenNotice';
import { LoginPrompt } from '@/components/LoginPrompt';
import { PdfViewer } from '@/components/PdfViewer';
import { StatusBadge } from '@/components/StatusBadge';
import { TagList } from '@/components/TagList';
import { cn } from '@/lib/utils';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-32 border-t border-border pt-14 pb-2">
      <h2 id={`${id}-heading`} className="headline-md mb-8">
        {title}
      </h2>
      {children}
    </section>
  );
}

// Paper detail (README §3.3): abstract, PDF viewer/download, views, APA/BibTeX,
// version history, comments across all versions, report button.
// `version` omitted → latest visible version (/papers/[concept_id]).
export async function PaperDetail({ conceptId, version }: { conceptId: string; version?: number }) {
  const supabase = await createClient();
  const [viewer, versions] = await Promise.all([getViewer(supabase), getPaperVersions(conceptId)]);
  const viewerId = viewer?.user.id ?? null;
  const role = viewer?.profile.role ?? null;

  const latest = versions[0];
  const paper = version === undefined ? latest : versions.find((v) => v.version_no === version);
  if (!paper || !canView(paper, viewerId, role)) notFound();
  const isLatest = paper.id === latest.id;
  const isAuthor = viewerId === paper.author_id;

  if (!isAuthor) await supabase.rpc('increment_paper_view', { p_paper_id: paper.id });

  const { data: commentRows } = await supabase
    .from('paper_comments')
    .select('id, author_id, content, written_at_version, status, created_at, profiles(nickname), papers!inner(concept_id)')
    .eq('papers.concept_id', conceptId)
    .order('created_at', { ascending: true });
  const comments = toThreadComments(commentRows ?? []);
  const path = version === undefined ? `/papers/${conceptId}` : `/papers/${conceptId}/v/${version}`;
  const downloadHref = `/api/papers/${paper.id}/download`;

  const specs = [
    { label: '영구 식별자', value: paper.concept_id, mono: true },
    { label: '버전', value: `v${paper.version_no}${isLatest ? ' (최신)' : ''}` },
    { label: '조회수', value: paper.view_count.toLocaleString('ko-KR') },
    { label: '게시일', value: formatDate(paper.created_at) },
    ...(paper.school ? [{ label: '학교', value: paper.school }] : []),
  ];

  return (
    <>
      <LocalNav
        title={paper.concept_id}
        titleHref={`/papers/${conceptId}`}
        links={[
          { href: '#abstract', label: '초록' },
          { href: '#pdf', label: '본문' },
          { href: '#cite', label: '인용' },
          { href: '#versions', label: '버전' },
          { href: '#comments', label: '댓글' },
        ]}
        cta={{ href: downloadHref, label: 'PDF 다운로드', plain: true }}
      />
      {paper.status === 'hidden' && <HiddenNotice isAdmin={role === 'admin' && !isAuthor} />}
      {!isLatest && (
        <div role="note" className="bg-surface px-5 py-3 text-center text-[14px]">
          <span className="text-muted-foreground">구버전(v{paper.version_no})을 보고 있습니다.</span>{' '}
          <Link href={`/papers/${conceptId}`} className="link-chevron">
            최신 버전 v{latest.version_no} 보기
          </Link>
        </div>
      )}

      <Container>
        <header className="mx-auto max-w-[880px] pt-14 pb-14 text-center sm:pt-20">
          <p className="eyebrow flex items-center justify-center gap-2 text-muted-foreground">
            <span className="font-mono tracking-normal">{paper.concept_id}</span>
            <span aria-hidden>·</span>
            <span>v{paper.version_no}</span>
            <StatusBadge status={paper.status} />
          </p>
          <h1 className="headline-lg mt-4">{paper.title}</h1>
          <p className="subhead mt-5 text-muted-foreground">
            {paper.authors}
            {paper.school && <span className="text-ink-3"> · {paper.school}</span>}
          </p>
          <TagList className="mt-6 justify-center" tags={paper.tags} hrefFor={(t) => `/papers?tag=${encodeURIComponent(t)}`} />
          <div id="paper-actions" className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={downloadHref} className={buttonVariants({ size: 'lg' })}>
              <Download aria-hidden />
              PDF 다운로드
            </a>
            <a href="#cite" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              인용하기
            </a>
            {isAuthor && (
              <Link href={`/papers/${conceptId}/upload-version`} className={buttonVariants({ size: 'lg', variant: 'secondary' })}>
                새 버전 업로드
              </Link>
            )}
          </div>
          {(!isAuthor || role === 'admin') && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1">
              {!isAuthor && <ReportButton targetType="paper" targetId={paper.id} loggedIn={viewer !== null} />}
              {role === 'admin' && <AdminModerationButtons targetType="paper" targetId={paper.id} status={paper.status} />}
            </div>
          )}
        </header>

        <div className="mx-auto max-w-[880px] space-y-16">
          <Section id="abstract" title="초록.">
            <p className="text-[19px] leading-[1.7] whitespace-pre-wrap text-ink-2">{paper.abstract}</p>
            {/* Identifier gets a double-width cell so it never wraps. */}
            <dl className={cn('mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-border', specs.length === 5 ? 'sm:grid-cols-6' : 'sm:grid-cols-5')}>
              {specs.map((s, i) => (
                <div
                  key={s.label}
                  className={cn('bg-surface px-5 py-6', i === 0 ? 'col-span-2' : 'max-sm:[&:last-child:nth-child(even)]:col-span-2')}
                >
                  <dt className="text-[12px] text-muted-foreground">{s.label}</dt>
                  <dd className={cn('mt-1.5 text-[17px] font-semibold', s.mono ? 'font-mono tracking-normal whitespace-nowrap' : 'break-words')}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="pdf" title="본문.">
            <PdfViewer paperId={paper.id} title={paper.title} />
          </Section>

          <Section id="cite" title="인용.">
            <CitationBlock
              baseUrl={getSiteUrl()}
              paper={{
                concept_id: paper.concept_id,
                version_no: paper.version_no,
                authors: paper.authors,
                title: paper.title,
                created_at: paper.created_at,
              }}
            />
          </Section>

          <Section id="versions" title="버전 히스토리.">
            <nav aria-labelledby="versions-heading">
              <ol className="overflow-hidden rounded-[22px] bg-surface">
                {versions.map((v) => {
                  const current = v.id === paper.id;
                  return (
                    <li key={v.id} className="border-b border-border last:border-0">
                      <Link
                        href={v.id === latest.id ? `/papers/${conceptId}` : `/papers/${conceptId}/v/${v.version_no}`}
                        aria-current={current ? 'page' : undefined}
                        className={cn('flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#ececf0]', current && 'bg-white')}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={cn('text-[17px] font-bold', current ? 'text-link' : 'text-foreground')}>v{v.version_no}</span>
                          <span className="truncate text-[15px] text-ink-2">{v.title}</span>
                          {v.id === latest.id ? (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">최신</span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-[#e8e8ed] px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">구버전</span>
                          )}
                          <StatusBadge status={v.status} />
                        </span>
                        <time dateTime={v.created_at} className="shrink-0 text-[13px] text-muted-foreground">
                          {formatDate(v.created_at)}
                        </time>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </Section>

          <Section id="comments" title={`댓글 ${comments.length}.`}>
            <p className="-mt-5 mb-8 text-[14px] text-muted-foreground">모든 버전의 댓글이 함께 표시되며, 작성 당시 버전이 배지로 표시됩니다.</p>
            <CommentThread comments={comments} targetType="paper_comment" viewerId={viewerId} viewerRole={role} />
            <div className="mt-6">
              {viewer ? (
                <CommentForm action={addPaperComment.bind(null, latest.id)} hint={`현재 최신 버전(v${latest.version_no})에 작성됩니다.`} />
              ) : (
                <LoginPrompt next={path} action="댓글을 남길" />
              )}
            </div>
          </Section>
        </div>
      </Container>
    </>
  );
}
