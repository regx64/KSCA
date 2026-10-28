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
    <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      {title && <p className="font-heading text-base font-semibold">{title}</p>}
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
