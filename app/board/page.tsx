import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '@/lib/board';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: '게시판' };

const PREVIEW_COUNT = 3;

export default async function BoardPage() {
  const supabase = await createClient();
  const sections = await Promise.all(
    CATEGORIES.map(async (category) => {
      const { data, count } = await supabase
        .from('posts')
        .select('id, title, created_at', { count: 'exact' })
        .eq('category', category)
        .eq('status', 'public')
        .order('created_at', { ascending: false })
        .limit(PREVIEW_COUNT);
      return { category, posts: data ?? [], count: count ?? 0 };
    })
  );

  return (
    <div>
      <PageHeader
        eyebrow="COMMUNITY"
        title="게시판"
        description="질문하고, 함께 공부할 사람을 찾고, 연구 이야기를 나누는 공간입니다."
        actions={
          <Link href="/board/write" className={buttonVariants()}>
            글쓰기
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ category, posts, count }) => (
          <section key={category} className="flex flex-col rounded-xl border bg-card p-5" aria-labelledby={`cat-${category}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={`cat-${category}`} className="text-lg font-bold">
                  <Link href={`/board/${category}`} className="hover:text-primary">
                    {CATEGORY_LABELS[category]}
                  </Link>
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {count}개
              </span>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {posts.length === 0 ? (
                <li className="text-muted-foreground">아직 게시글이 없습니다.</li>
              ) : (
                posts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <Link href={`/board/post/${p.id}`} className="truncate hover:text-primary">
                      {p.title}
                    </Link>
                    <time dateTime={p.created_at} className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(p.created_at)}
                    </time>
                  </li>
                ))
              )}
            </ul>
            <Link
              href={`/board/${category}`}
              className="mt-4 flex items-center gap-0.5 self-end text-sm font-medium text-primary hover:underline"
            >
              전체 보기
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
