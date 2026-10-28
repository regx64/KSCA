import { cn } from '@/lib/utils';

// README §3.4: each paper comment shows which version it was written on.
export function VersionBadge({ version, className }: { version: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-[#e8f1fc] px-2 py-0.5 text-[11px] font-semibold text-link', className)}>
      v{version}에 작성됨
    </span>
  );
}
