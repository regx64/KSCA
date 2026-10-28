import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '@/lib/board';
import { formatDate } from '@/lib/format';
import { Container } from '@/components/Container';
import { PageHeader } from '@/components/PageHeader';
import { BoardNav } from '@/components/BoardNav';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BoardCategory } from '@/lib/types';

export const metadata: Metadata = { title: '커뮤니티' };

const PREVIEW_COUNT = 3;

const TILE_STYLE: Record<BoardCategory, string> = {
  notice: 'bg-[#1d1d1f] text-white',
  free: 'bg-surface',
  question: 'bg-surface',
  study: 'bg-surface',
};

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
    <>
      <BoardNav />
      <Container>
        <PageHeader
          align="center"
          title="커뮤니티."
          description="질문하고, 함께 공부할 사람을 찾고, 연구 이야기를 나누세요."
          actions={
            <Link href="/board/write" className={buttonVariants({ size: 'lg' })}>
              글쓰기
            </Link>
          }
        />
      </Container>
      <div className="mx-auto grid max-w-[1200px] gap-3 px-3 md:grid-cols-2">
        {sections.map(({ category, posts, count }) => {
          const dark = category === 'notice';
          return (
            <section key={category} aria-labelledby={`cat-${category}`} className={cn('flex flex-col rounded-[28px] px-8 py-10 sm:px-10', TILE_STYLE[category])}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id={`cat-${category}`} className="headline-md">
                    <Link href={`/board/${category}`} className="hover:underline hover:underline-offset-4">
                      {CATEGORY_LABELS[category]}.
                    </Link>
                  </h2>
                  <p className={cn('mt-2 text-[15px]', dark ? 'text-[#a1a1a6]' : 'text-muted-foreground')}>{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
                <span className={cn('shrink-0 text-[13px] tabular-nums', dark ? 'text-[#a1a1a6]' : 'text-muted-foreground')}>{count}개</span>
              </div>
              <ul className="mt-8 flex-1 space-y-2">
                {posts.length === 0 ? (
                  <li className={cn('text-[15px]', dark ? 'text-[#a1a1a6]' : 'text-muted-foreground')}>아직 게시글이 없습니다.</li>
                ) : (
                  posts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/board/post/${p.id}`}
                        className={cn(
                          'flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition',
                          dark ? 'bg-white/10 hover:bg-white/15' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]'
                        )}
                      >
                        <span className="truncate text-[15px] font-semibold">{p.title}</span>
                        <time dateTime={p.created_at} className={cn('shrink-0 text-[12px]', dark ? 'text-[#a1a1a6]' : 'text-muted-foreground')}>
                          {formatDate(p.created_at)}
                        </time>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              <Link href={`/board/${category}`} className={cn('link-chevron mt-8 text-[17px]', dark && '!text-[#2997ff]')}>
                {CATEGORY_LABELS[category]} 전체 보기
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
