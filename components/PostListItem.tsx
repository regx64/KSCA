import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { CATEGORY_LABELS } from '@/lib/board';
import type { BoardCategory, ContentStatus } from '@/lib/types';

export type PostListData = {
  id: string;
  title: string;
  category: BoardCategory;
  tags: string[];
  status: ContentStatus;
  created_at: string;
  author: string;
  commentCount: number;
};

export function PostListItem({ post, showCategory = false }: { post: PostListData; showCategory?: boolean }) {
  return (
    <li className="group relative flex items-center justify-between gap-6 py-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {showCategory && <span className="text-[12px] font-semibold text-link">{CATEGORY_LABELS[post.category]}</span>}
          <Link
            href={`/board/post/${post.id}`}
            className="text-[17px] font-semibold tracking-[-0.015em] after:absolute after:inset-0 group-hover:text-link"
          >
            {post.title}
          </Link>
          <StatusBadge status={post.status} />
        </div>
        <p className="mt-1 flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
          {post.tags.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground tabular-nums" title="댓글 수">
        <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">댓글</span>
        {post.commentCount}
      </span>
    </li>
  );
}

type PostRow = {
  id: string;
  title: string;
  category: BoardCategory;
  tags: string[];
  status: ContentStatus;
  created_at: string;
  profiles: { nickname: string } | { nickname: string }[] | null;
  comments: { count: number }[] | null;
};

export const POST_LIST_SELECT = 'id, title, category, tags, status, created_at, profiles(nickname), comments(count)';

export function toPostListData(rows: PostRow[]): PostListData[] {
  return rows.map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      tags: r.tags,
      status: r.status,
      created_at: r.created_at,
      author: profile?.nickname ?? '알 수 없음',
      commentCount: r.comments?.[0]?.count ?? 0,
    };
  });
}
