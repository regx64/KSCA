import Link from 'next/link';
import { excerpt, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { Paper } from '@/lib/types';

export type PaperCardData = Pick<
  Paper,
  'concept_id' | 'version_no' | 'title' | 'authors' | 'abstract' | 'tags' | 'school' | 'view_count' | 'created_at' | 'status'
>;

// Apple-style tile: soft gray surface, no border, gentle lift on hover.
export function PaperCard({ paper, className }: { paper: PaperCardData; className?: string }) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-[22px] bg-surface p-6 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_40px_rgba(0,0,0,0.10)] sm:p-7',
        className
      )}
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
        <span className="font-mono tracking-normal">{paper.concept_id}</span>
        <span aria-hidden>·</span>
        <span>v{paper.version_no}</span>
        <StatusBadge status={paper.status} />
      </div>
      <h3 className="mt-3 line-clamp-2 text-[21px] leading-[1.25] font-bold tracking-[-0.02em]">
        <Link href={`/papers/${paper.concept_id}`} className="after:absolute after:inset-0 after:rounded-[22px]">
          {paper.title}
        </Link>
      </h3>
      <p className="mt-1.5 text-[14px] text-muted-foreground">
        {paper.authors}
        {paper.school ? ` · ${paper.school}` : ''}
      </p>
      <p className="mt-4 line-clamp-3 text-[15px] leading-[1.55] text-ink-2">{excerpt(paper.abstract, 200)}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6 text-[12px] text-muted-foreground">
        <span className="line-clamp-1">{paper.tags.slice(0, 3).map((t) => `#${t}`).join('  ')}</span>
        <span className="shrink-0 tabular-nums">
          조회 {paper.view_count.toLocaleString('ko-KR')} · <time dateTime={paper.created_at}>{formatDate(paper.created_at)}</time>
        </span>
      </div>
    </article>
  );
}
