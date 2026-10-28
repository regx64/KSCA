import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, Eye, FileUp, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { getPaperVersions } from '@/lib/papers';
import { canView } from '@/lib/visibility';
import { toThreadComments } from '@/lib/comments';
import { formatDate } from '@/lib/format';
import { getSiteUrl } from '@/lib/site';
import { addPaperComment } from '@/lib/actions/comments';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

  return (
    <div>
      {paper.status === 'hidden' && <HiddenNotice isAdmin={role === 'admin' && !isAuthor} />}
      {!isLatest && (
        <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent bg-accent/40 px-4 py-3 text-sm">
          <span>
            <strong className="font-semibold">구버전</strong>(v{paper.version_no})을 보고 있습니다.
          </span>
          <Link href={`/papers/${conceptId}`} className="font-medium text-primary underline underline-offset-4">
            최신 버전 v{latest.version_no} 보기
          </Link>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 space-y-8">
          <header>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              <span>{paper.concept_id}</span>
              <span aria-hidden>·</span>
              <span>v{paper.version_no}</span>
              <StatusBadge status={paper.status} />
            </div>
            <h1 className="mt-2 text-2xl leading-snug font-bold sm:text-3xl">{paper.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{paper.authors}</span>
              {paper.school && <> · {paper.school}</>} · {formatDate(paper.created_at)}
            </p>
            <TagList className="mt-4" tags={paper.tags} hrefFor={(t) => `/papers?tag=${encodeURIComponent(t)}`} />
            <a
              href={`/api/papers/${paper.id}/download`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-4 lg:hidden' })}
            >
              <Download aria-hidden />
              PDF 다운로드
            </a>
          </header>

          <section aria-labelledby="abstract-heading">
            <h2 id="abstract-heading" className="mb-2 text-lg font-bold">
              초록
            </h2>
            <p className="leading-7 whitespace-pre-wrap">{paper.abstract}</p>
          </section>

          <section aria-labelledby="pdf-heading">
            <h2 id="pdf-heading" className="mb-3 text-lg font-bold">
              본문 PDF
            </h2>
            <PdfViewer paperId={paper.id} title={paper.title} />
          </section>

          <section aria-labelledby="cite-heading">
            <h2 id="cite-heading" className="mb-3 text-lg font-bold">
              인용하기
            </h2>
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
          </section>

          <section aria-labelledby="comments-heading" className="space-y-4">
            <div>
              <h2 id="comments-heading" className="text-lg font-bold">
                댓글 <span className="text-muted-foreground">{comments.length}</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">모든 버전의 댓글이 함께 표시되며, 작성 당시 버전이 배지로 표시됩니다.</p>
            </div>
            <CommentThread comments={comments} targetType="paper_comment" viewerId={viewerId} viewerRole={role} />
            {viewer ? (
              <CommentForm action={addPaperComment.bind(null, latest.id)} hint={`현재 최신 버전(v${latest.version_no})에 작성됩니다.`} />
            ) : (
              <LoginPrompt next={path} action="댓글을 남길" />
            )}
          </section>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">영구 식별자</p>
            <p className="mt-1 font-mono text-sm font-semibold break-all">{paper.concept_id}</p>
            <div className="mt-4 grid gap-2">
              <a href={`/api/papers/${paper.id}/download`} className={buttonVariants({ className: 'w-full' })}>
                <Download aria-hidden />
                PDF 다운로드
              </a>
              {isAuthor && (
                <Link href={`/papers/${conceptId}/upload-version`} className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
                  <FileUp aria-hidden />
                  새 버전 업로드
                </Link>
              )}
            </div>
            <Separator className="my-4" />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">조회수</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Eye className="size-3.5" aria-hidden />
                  {paper.view_count.toLocaleString('ko-KR')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">버전</dt>
                <dd className="font-medium">v{paper.version_no}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-1">
              {!isAuthor && <ReportButton targetType="paper" targetId={paper.id} loggedIn={viewer !== null} />}
              {role === 'admin' && <AdminModerationButtons targetType="paper" targetId={paper.id} status={paper.status} />}
            </div>
          </div>

          <nav aria-labelledby="versions-heading" className="rounded-xl border bg-card p-5">
            <h2 id="versions-heading" className="flex items-center gap-1.5 text-sm font-bold">
              <History className="size-4" aria-hidden />
              버전 히스토리
            </h2>
            <ol className="mt-3 space-y-1">
              {versions.map((v) => {
                const current = v.id === paper.id;
                return (
                  <li key={v.id}>
                    <Link
                      href={v.id === latest.id ? `/papers/${conceptId}` : `/papers/${conceptId}/v/${v.version_no}`}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-md px-2 py-1.5 text-sm',
                        current ? 'bg-secondary font-medium text-secondary-foreground' : 'hover:bg-muted'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        v{v.version_no}
                        {v.id === latest.id ? (
                          <span className="rounded bg-primary px-1.5 text-[0.65rem] text-primary-foreground">최신</span>
                        ) : (
                          <span className="rounded bg-muted px-1.5 text-[0.65rem] text-muted-foreground">구버전</span>
                        )}
                        <StatusBadge status={v.status} />
                      </span>
                      <time dateTime={v.created_at} className="text-xs text-muted-foreground">
                        {formatDate(v.created_at)}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}
