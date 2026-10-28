import Link from 'next/link';
import { cn } from '@/lib/utils';

// Tags as chips. With `hrefFor`, each chip links to a filtered list.
export function TagList({
  tags,
  hrefFor,
  className,
}: {
  tags: string[];
  hrefFor?: (tag: string) => string;
  className?: string;
}) {
  if (tags.length === 0) return null;
  const chip = 'inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground';
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="태그">
      {tags.map((t) => (
        <li key={t}>
          {hrefFor ? (
            <Link href={hrefFor(t)} className={cn(chip, 'hover:bg-secondary/70')}>
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
