import { cn } from '@/lib/utils';

// Apple-style page intro: very large headline ending in a period, with a
// muted subhead. `align="center"` for hero-like pages.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  const center = align === 'center';
  return (
    <div className={cn('pt-12 pb-10 sm:pt-16 sm:pb-12', center && 'text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3 text-muted-foreground">{eyebrow}</p>}
      <h1 className="headline-lg">{title}</h1>
      {description && (
        <p className={cn('subhead mt-4 max-w-2xl text-muted-foreground', center && 'mx-auto')}>{description}</p>
      )}
      {actions && <div className={cn('mt-7 flex flex-wrap items-center gap-4', center && 'justify-center')}>{actions}</div>}
    </div>
  );
}
