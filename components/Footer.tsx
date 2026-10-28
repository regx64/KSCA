import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} KSCA — Korea Student Computer science Association
        </p>
        <nav aria-label="하단 메뉴" className="flex gap-4">
          <Link href="/papers" className="hover:text-foreground">
            아카이브
          </Link>
          <Link href="/board" className="hover:text-foreground">
            게시판
          </Link>
          <Link href="/board/notice" className="hover:text-foreground">
            공지
          </Link>
        </nav>
      </div>
    </footer>
  );
}
