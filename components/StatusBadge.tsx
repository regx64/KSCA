import type { ContentStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: ContentStatus }) {
  if (status === 'public') return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[#fde8e8] px-2 py-0.5 text-[11px] font-semibold text-destructive">
      비공개
    </span>
  );
}
