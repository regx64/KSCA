import type { ContentStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: ContentStatus }) {
  if (status === 'public') return null;
  return (
    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[0.7rem] font-medium text-destructive">
      비공개
    </span>
  );
}
