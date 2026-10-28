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
    <div className="mx-auto max-w-3xl">
      {post.status === 'hidden' && <HiddenNotice isAdmin={role === 'admin' && !isAuthor} />}
      <article>
        <header className="border-b pb-5">
          <Link href={`/board/${post.category}`} className="text-xs font-medium text-primary hover:underline">
            {CATEGORY_LABELS[post.category]}
          </Link>
          <h1 className="mt-1.5 text-2xl leading-snug font-bold sm:text-3xl">
            {post.title} <StatusBadge status={post.status} />
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{post.profiles?.nickname ?? '알 수 없음'}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
            <span className="ml-auto flex items-center gap-1">
              {role === 'admin' && <AdminModerationButtons targetType="post" targetId={post.id} status={post.status} />}
              {!isAuthor && <ReportButton targetType="post" targetId={post.id} loggedIn={viewer !== null} />}
            </span>
          </div>
        </header>
        <div className="py-6">
          <Markdown>{post.content}</Markdown>
        </div>
        <TagList tags={post.tags} hrefFor={(t) => `/board/${post.category}?tag=${encodeURIComponent(t)}`} />
      </article>

      <section aria-labelledby="comments-heading" className="mt-10 space-y-4">
        <h2 id="comments-heading" className="text-lg font-bold">
          댓글 <span className="text-muted-foreground">{comments.length}</span>
        </h2>
        <CommentThread comments={comments} targetType="comment" viewerId={viewerId} viewerRole={role} />
        {viewer ? (
          <CommentForm action={addBoardComment.bind(null, post.id)} />
        ) : (
          <LoginPrompt next={`/board/post/${post.id}`} action="댓글을 남길" />
        )}
      </section>

      <div className="mt-10">
        <Link href={`/board/${post.category}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {CATEGORY_LABELS[post.category]} 목록으로
        </Link>
      </div>
    </div>
  );
}
