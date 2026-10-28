import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';
import { buttonVariants } from '@/components/ui/button';
import { NavLinks } from '@/components/NavLinks';
import { Logo } from '@/components/Logo';

export async function Nav() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  const links = [
    { href: '/papers', label: '아카이브' },
    { href: '/board', label: '게시판' },
    ...(viewer?.profile.role === 'admin' ? [{ href: '/admin', label: '운영진' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="KSCA 홈">
          <Logo />
        </Link>
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-2 text-sm">
          {viewer ? (
            <>
              <Link href="/papers/upload" className={buttonVariants({ size: 'sm' })}>
                논문 업로드
              </Link>
              <Link href="/me" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                {viewer.profile.nickname}
              </Link>
              <form action={signOut}>
                <button type="submit" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                로그인
              </Link>
              <Link href="/signup" className={buttonVariants({ size: 'sm' })}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
