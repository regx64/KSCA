import Link from 'next/link';

export function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-[18px] bg-surface px-6 py-14 text-center">
      {title && <p className="text-[21px] font-semibold tracking-[-0.02em]">{title}</p>}
      <p className="mt-1.5 text-[15px] text-muted-foreground">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="link-chevron mt-4 text-[15px]">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
