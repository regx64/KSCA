import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagList({ tags, hrefFor, className }: { tags: string[]; hrefFor?: (tag: string) => string; className?: string }) {
  if (tags.length === 0) return null;
  const chip = 'inline-flex items-center rounded-full bg-surface px-3 py-1 text-[13px] text-ink-2';
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="태그">
      {tags.map((t) => (
        <li key={t}>
          {hrefFor ? (
            <Link href={hrefFor(t)} className={cn(chip, 'transition hover:bg-[#e8e8ed] hover:text-foreground')}>
              #{t}
            </Link>
          ) : (
            <span className={chip}>#{t}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
