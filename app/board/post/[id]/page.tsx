import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { canView } from '@/lib/visibility';
import { CATEGORY_LABELS } from '@/lib/board';
import { toThreadComments } from '@/lib/comments';
import { excerpt, formatDateTime } from '@/lib/format';
import { isUuid } from '@/lib/validation';
import { addBoardComment } from '@/lib/actions/comments';
import { Markdown } from '@/components/Markdown';
import { TagList } from '@/components/TagList';
import { CommentThread } from '@/components/CommentThread';
import { CommentForm } from '@/components/CommentForm';
import { ReportButton } from '@/components/ReportButton';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import { HiddenNotice } from '@/components/HiddenNotice';
import { LoginPrompt } from '@/components/LoginPrompt';
import { StatusBadge } from '@/components/StatusBadge';
import { Container } from '@/components/Container';
import { BoardNav } from '@/components/BoardNav';
import type { BoardCategory, ContentStatus } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

type PostRow = {
  id: string;
  author_id: string;
  category: BoardCategory;
  title: string;
  content: string;
  tags: string[];
  status: ContentStatus;
  created_at: string;
  profiles: { nickname: string } | null;
};

const getPost = cache(async (id: string): Promise<PostRow | null> => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('posts').select('*, profiles(nickname)').eq('id', id).maybeSingle();
  return data as PostRow | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).id);
  return post ? { title: post.title, description: excerpt(post.content, 160) } : { title: '게시글을 찾을 수 없습니다' };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [viewer, post] = await Promise.all([getViewer(supabase), getPost(id)]);
  const viewerId = viewer?.user.id ?? null;
  const role = viewer?.profile.role ?? null;
  if (!post || !canView(post, viewerId, role)) notFound();
  const isAuthor = viewerId === post.author_id;

  const { data: commentRows } = await supabase
    .from('comments')
    .select('id, author_id, content, status, created_at, profiles(nickname)')
    .eq('post_id', id)
    .order('created_at', { ascending: true });
  const comments = toThreadComments(commentRows ?? []);

  return (
    <>
      <BoardNav active={post.category} />
      {post.status === 'hidden' && <HiddenNotice isAdmin={role === 'admin' && !isAuthor} />}
      <Container size="narrow">
        <article>
          <header className="pt-14 pb-10 sm:pt-20">
            <Link href={`/board/${post.category}`} className="eyebrow text-link hover:underline">
              {CATEGORY_LABELS[post.category]}
            </Link>
            <h1 className="headline-lg mt-3">
              {post.title} <StatusBadge status={post.status} />
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-muted-foreground">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#e8e8ed] to-[#d2d2d7] text-[14px] font-semibold text-ink-2" aria-hidden>
                {(post.profiles?.nickname ?? '?').slice(0, 1)}
              </span>
              <span className="font-semibold text-foreground">{post.profiles?.nickname ?? '알 수 없음'}</span>
              <time dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
              <span className="ml-auto flex items-center gap-1">
                {role === 'admin' && <AdminModerationButtons targetType="post" targetId={post.id} status={post.status} />}
                {!isAuthor && <ReportButton targetType="post" targetId={post.id} loggedIn={viewer !== null} />}
              </span>
            </div>
          </header>
          <div className="border-t border-border pt-10">
            <Markdown>{post.content}</Markdown>
          </div>
          <TagList className="mt-10" tags={post.tags} hrefFor={(t) => `/board/${post.category}?tag=${encodeURIComponent(t)}`} />
        </article>

        <section aria-labelledby="comments-heading" className="mt-16 border-t border-border pt-14">
          <h2 id="comments-heading" className="headline-md mb-8">
            댓글 {comments.length}.
          </h2>
          <CommentThread comments={comments} targetType="comment" viewerId={viewerId} viewerRole={role} />
          <div className="mt-6">
            {viewer ? <CommentForm action={addBoardComment.bind(null, post.id)} /> : <LoginPrompt next={`/board/post/${post.id}`} action="댓글을 남길" />}
          </div>
        </section>

        <div className="mt-14">
          <Link href={`/board/${post.category}`} className="link-chevron text-[15px]">
            {CATEGORY_LABELS[post.category]} 목록으로
          </Link>
        </div>
      </Container>
    </>
  );
}
