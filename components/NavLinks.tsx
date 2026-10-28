'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-8 md:flex">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== '/board' && pathname.startsWith(`${l.href}/`)) || (l.href === '/board' && pathname.startsWith('/board') && !pathname.startsWith('/board/notice'));
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'text-[12px] tracking-[-0.01em] transition-colors hover:text-foreground',
                active ? 'text-foreground' : 'text-foreground/70'
              )}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
