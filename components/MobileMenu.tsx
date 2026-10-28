'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/lib/actions/auth';

// Full-screen menu for small screens, like apple.com's mobile nav.
export function MobileMenu({ links, viewerName }: { links: { href: string; label: string }[]; viewerName: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-full hover:bg-black/5"
      >
        <span
          className={`absolute h-[1.5px] w-[17px] bg-foreground transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[4px]'}`}
        />
        <span
          className={`absolute h-[1.5px] w-[17px] bg-foreground transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[4px]'}`}
        />
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-12 bottom-0 z-50 overflow-y-auto bg-[rgba(251,251,253,0.98)] px-10 pt-6 pb-16 backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2 duration-300"
        >
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="block py-1.5 text-[28px] font-semibold tracking-[-0.02em] text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 space-y-3 text-[14px] text-muted-foreground">
            {viewerName ? (
              <>
                <Link href="/me" onClick={close} className="block text-foreground">
                  {viewerName} · 마이페이지
                </Link>
                <form action={signOut}>
                  <button type="submit" className="text-link">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={close} className="block text-foreground">
                  로그인
                </Link>
                <Link href="/signup" onClick={close} className="block text-link">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
