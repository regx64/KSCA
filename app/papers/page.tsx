import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ilikeAnyFilter, paperListHref, parsePaperListParams } from '@/lib/papers-query';
import { pageRange, totalPages } from '@/lib/pagination';
import { PaperCard, type PaperCardData } from '@/components/PaperCard';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: '논문 아카이브' };

const POPULAR_TAG_COUNT = 12;

export default async function PapersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parsePaperListParams(await searchParams);
  const { sort, tag, q, page } = params;
  const supabase = await createClient();

  // latest_papers = one row per concept_id (its newest visible version).
  let query = supabase
    .from('latest_papers')
    .select('concept_id, version_no, title, authors, abstract, tags, school, view_count, created_at, status', { count: 'exact' });
  if (tag) query = query.contains('tags', [tag]);
  if (q) query = query.or(ilikeAnyFilter(['title', 'authors', 'abstract'], q));
  query =
    sort === 'views'
      ? query.order('view_count', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });
  const { from, to } = pageRange(page);

  const [{ data: papers, count }, { data: tagRows }] = await Promise.all([
    query.range(from, to),
    supabase.from('latest_papers').select('tags').eq('status', 'public'),
  ]);

  const tagCounts = new Map<string, number>();
  for (const row of tagRows ?? []) for (const t of row.tags as string[]) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const popularTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, POPULAR_TAG_COUNT)
    .map(([t]) => t);

  const pages = totalPages(count ?? 0);
  const filtered = Boolean(tag || q);

  return (
    <div>
      <PageHeader
        eyebrow="ARCHIVE"
        title="논문 아카이브"
        description="전국 청소년의 컴퓨터 사이언스 연구와 프로젝트. 모든 논문은 영구 식별자로 인용할 수 있습니다."
        actions={
          <Link href="/papers/upload" className={buttonVariants()}>
            논문 업로드
          </Link>
        }
      />

      <div className="space-y-4">
        <form action="/papers" className="flex gap-2" role="search">
          {tag && <input type="hidden" name="tag" value={tag} />}
          {sort !== 'latest' && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">
            논문 검색
          </label>
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="q" name="q" defaultValue={q ?? ''} placeholder="제목, 저자, 초록으로 검색" className="h-10 bg-card pl-9" />
          </div>
          <button type="submit" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-10' })}>
            검색
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="정렬" className="flex rounded-lg border bg-card p-0.5 text-sm">
            {(
              [
                ['latest', '최신순'],
                ['views', '조회수순'],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={paperListHref({ ...params, sort: value, page: 1 })}
                aria-current={sort === value ? 'true' : undefined}
                className={cn(
                  'rounded-md px-3 py-1',
                  sort === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground">
            {filtered ? '검색 결과 ' : '전체 '}
            <span className="font-medium text-foreground">{(count ?? 0).toLocaleString('ko-KR')}</span>편
          </p>
        </div>

        {popularTags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="분야 태그 필터">
            {popularTags.map((t) => {
              const active = t === tag;
              return (
                <li key={t}>
                  <Link
                    href={paperListHref({ ...params, tag: active ? null : t, page: 1 })}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    #{t}
                    {active && <X className="size-3" aria-label="필터 해제" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8">
        {!papers || papers.length === 0 ? (
          filtered ? (
            <EmptyState title="검색 결과가 없어요" message="다른 검색어나 태그로 찾아보세요." actionLabel="전체 논문 보기" actionHref="/papers" />
          ) : (
            <EmptyState
              title="아직 등록된 논문이 없어요"
              message="첫 번째 연구를 공유해 보세요."
              actionLabel="첫 논문 업로드하기"
              actionHref="/papers/upload"
            />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(papers as PaperCardData[]).map((p) => (
              <PaperCard key={p.concept_id} paper={p} />
            ))}
          </div>
        )}
        <Pagination page={page} total={pages} hrefFor={(n) => paperListHref({ ...params, page: n })} />
      </div>
    </div>
  );
}
