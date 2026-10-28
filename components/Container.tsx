import { cn } from '@/lib/utils';

// Apple-style content column: 980px reading width, 1024px for grids.
export function Container({
  children,
  className,
  size = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'narrow' | 'default' | 'wide';
}) {
  const max = size === 'narrow' ? 'max-w-[720px]' : size === 'wide' ? 'max-w-[1200px]' : 'max-w-[1024px]';
  return <div className={cn('mx-auto w-full px-5 sm:px-6', max, className)}>{children}</div>;
}
