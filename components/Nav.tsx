import Link from 'next/link';
import { Search, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { NavLinks } from '@/components/NavLinks';
import { MobileMenu } from '@/components/MobileMenu';

// Global nav modeled on apple.com: 48px, translucent with backdrop blur,
// small centered links, utility icons on the right.
export async function Nav() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  const links = [
    { href: '/papers', label: '아카이브' },
    { href: '/board', label: '커뮤니티' },
    { href: '/board/notice', label: '공지' },
    { href: '/papers/upload', label: '업로드' },
    ...(viewer?.profile.role === 'admin' ? [{ href: '/admin', label: '운영진' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(251,251,253,0.8)] backdrop-blur-xl backdrop-saturate-[1.8]">
      <nav aria-label="전체 메뉴" className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-5 sm:px-6">
        <Link href="/" className="text-[17px] font-bold tracking-[-0.03em] text-foreground" aria-label="KSCA 홈">
          KSCA
        </Link>
        <NavLinks links={links} />
        <div className="flex items-center gap-1">
          <Link
            href="/papers#search"
            aria-label="논문 검색"
            className="grid size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-black/5 hover:text-foreground"
          >
            <Search className="size-[17px]" strokeWidth={1.75} />
          </Link>
          <Link
            href={viewer ? '/me' : '/login'}
            aria-label={viewer ? `${viewer.profile.nickname} 마이페이지` : '로그인'}
            className="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] text-foreground/80 transition hover:bg-black/5 hover:text-foreground md:flex"
          >
            <UserRound className="size-[17px]" strokeWidth={1.75} aria-hidden />
            <span>{viewer ? viewer.profile.nickname : '로그인'}</span>
          </Link>
          <MobileMenu links={links} viewerName={viewer?.profile.nickname ?? null} />
        </div>
      </nav>
    </header>
  );
}
