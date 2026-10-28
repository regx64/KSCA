import { cn } from '@/lib/utils';

// README §3.4: each paper comment shows which version it was written on.
export function VersionBadge({ version, className }: { version: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[0.7rem] font-medium text-primary',
        className
      )}
    >
      v{version}에 작성됨
    </span>
  );
}
