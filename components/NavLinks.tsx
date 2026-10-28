'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1.5 transition-colors hover:bg-muted',
              active ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
