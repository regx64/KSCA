import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({ page, total, hrefFor }: { page: number; total: number; hrefFor: (page: number) => string }) {
  if (total <= 1) return null;
  const btn = 'grid size-10 place-items-center rounded-full bg-surface text-foreground transition hover:bg-[#e8e8ed]';
  const off = 'pointer-events-none opacity-30';
  return (
    <nav aria-label="페이지 이동" className="mt-12 flex items-center justify-center gap-4 text-[14px]">
      <Link href={hrefFor(page - 1)} aria-label="이전 페이지" aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={cn(btn, page <= 1 && off)}>
        <ChevronLeft className="size-4" />
      </Link>
      <span className="tabular-nums text-muted-foreground">
        <span className="font-semibold text-foreground">{page}</span> / {total}
      </span>
      <Link href={hrefFor(page + 1)} aria-label="다음 페이지" aria-disabled={page >= total} tabIndex={page >= total ? -1 : undefined} className={cn(btn, page >= total && off)}>
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
