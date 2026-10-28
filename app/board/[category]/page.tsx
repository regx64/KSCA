import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, canPostToCategory, isValidCategory } from '@/lib/board';
import { pageRange, parsePage, totalPages } from '@/lib/pagination';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { POST_LIST_SELECT, PostListItem, toPostListData } from '@/components/PostListItem';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return { title: isValidCategory(category) ? `${CATEGORY_LABELS[category]} 게시판` : '게시판' };
}

export default async function BoardCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (!isValidCategory(category)) notFound();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const tag = (Array.isArray(sp.tag) ? sp.tag[0] : sp.tag)?.trim() || null;

  const supabase = await createClient();
  const viewer = await getViewer(supabase);

  let query = supabase
    .from('posts')
    .select(POST_LIST_SELECT, { count: 'exact' })
    .eq('category', category)
    .order('created_at', { ascending: false });
  if (tag) query = query.contains('tags', [tag]);
  const { from, to } = pageRange(page, 20);
  const { data, count } = await query.range(from, to);
  const posts = toPostListData(data ?? []);

  const hrefFor = (n: number) => {
    const q = new URLSearchParams();
    if (tag) q.set('tag', tag);
    if (n > 1) q.set('page', String(n));
    const s = q.toString();
    return `/board/${category}${s ? `?${s}` : ''}`;
  };
  const canWrite = canPostToCategory(category, viewer?.profile.role ?? null);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/board" className="hover:underline">
            게시판
          </Link>
        }
        title={CATEGORY_LABELS[category]}
        description={CATEGORY_DESCRIPTIONS[category]}
        actions={
          (canWrite || !viewer) && (
            <Link href={`/board/write?category=${category}`} className={buttonVariants()}>
              글쓰기
            </Link>
          )
        }
      />

      <nav aria-label="카테고리" className="mb-4 flex flex-wrap gap-1.5 text-sm">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/board/${c}`}
            aria-current={c === category ? 'page' : undefined}
            className={cn(
              'rounded-full border px-3 py-1',
              c === category ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </nav>

      {tag && (
        <p className="mb-4 flex items-center gap-2 text-sm">
          태그 필터:
          <Link href={`/board/${category}`} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
            #{tag}
            <X className="size-3" aria-label="필터 해제" />
          </Link>
        </p>
      )}

      {posts.length === 0 ? (
        <EmptyState
          title="아직 게시글이 없어요"
          message={category === 'notice' ? '등록된 공지가 없습니다.' : '첫 글을 남겨보세요.'}
          actionLabel={canWrite ? '글쓰기' : undefined}
          actionHref={canWrite ? `/board/write?category=${category}` : undefined}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {posts.map((p) => (
            <PostListItem key={p.id} post={p} />
          ))}
        </ul>
      )}
      <Pagination page={page} total={totalPages(count ?? 0, 20)} hrefFor={hrefFor} />
    </div>
  );
}
