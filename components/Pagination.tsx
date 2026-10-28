import Link from 'next/link';
import { cn } from '@/lib/utils';

// Previous / "page X of Y" / next. `hrefFor` builds the URL for a page.
export function Pagination({ page, total, hrefFor }: { page: number; total: number; hrefFor: (page: number) => string }) {
  if (total <= 1) return null;
  const linkClass = 'rounded-md border px-3 py-1.5 hover:bg-muted';
  const disabledClass = 'pointer-events-none opacity-40';
  return (
    <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-3 text-sm">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(linkClass, page <= 1 && disabledClass)}
      >
        이전
      </Link>
      <span className="text-muted-foreground">
        {page} / {total}
      </span>
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= total}
        tabIndex={page >= total ? -1 : undefined}
        className={cn(linkClass, page >= total && disabledClass)}
      >
        다음
      </Link>
    </nav>
  );
}
