import Link from 'next/link';
import { Eye } from 'lucide-react';
import { excerpt, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import type { Paper } from '@/lib/types';

export type PaperCardData = Pick<
  Paper,
  'concept_id' | 'version_no' | 'title' | 'authors' | 'abstract' | 'tags' | 'school' | 'view_count' | 'created_at' | 'status'
>;

export function PaperCard({ paper }: { paper: PaperCardData }) {
  return (
    <article className="group relative flex h-full flex-col rounded-xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
        <span>{paper.concept_id}</span>
        <span aria-hidden>·</span>
        <span>v{paper.version_no}</span>
        <StatusBadge status={paper.status} />
      </div>
      <h3 className="mt-2 text-lg leading-snug font-semibold">
        <Link href={`/papers/${paper.concept_id}`} className="after:absolute after:inset-0 group-hover:text-primary">
          {paper.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {paper.authors}
        {paper.school ? ` · ${paper.school}` : ''}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80">{excerpt(paper.abstract, 220)}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {paper.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[0.7rem] font-medium text-secondary-foreground">
            #{t}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            <span className="sr-only">조회수</span>
            {paper.view_count.toLocaleString('ko-KR')}
          </span>
          <time dateTime={paper.created_at}>{formatDate(paper.created_at)}</time>
        </span>
      </div>
    </article>
  );
}
