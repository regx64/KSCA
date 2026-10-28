import Link from 'next/link';

const COLUMNS = [
  {
    title: '아카이브',
    links: [
      { href: '/papers', label: '전체 논문' },
      { href: '/papers?sort=views', label: '많이 본 논문' },
      { href: '/papers/upload', label: '논문 업로드' },
    ],
  },
  {
    title: '커뮤니티',
    links: [
      { href: '/board/free', label: '자유' },
      { href: '/board/question', label: '질문' },
      { href: '/board/study', label: '스터디·프로젝트 모집' },
      { href: '/board/notice', label: '공지' },
    ],
  },
  {
    title: '계정',
    links: [
      { href: '/me', label: '마이페이지' },
      { href: '/login', label: '로그인' },
      { href: '/signup', label: '회원가입' },
    ],
  },
];

// apple.com-style footer: small gray type on #f5f5f7, link columns,
// hairline divider, copyright row.
export function Footer() {
  return (
    <footer className="mt-24 bg-surface text-[12px] leading-[1.6] text-muted-foreground">
      <div className="mx-auto max-w-[1024px] px-5 py-10 sm:px-6">
        <p className="border-b border-hairline pb-4">
          KSCA는 전국 청소년 누구나 학교 인증 없이 참여하는 컴퓨터 사이언스 학회입니다. 업로드된 논문에는 영구 식별자가
          발급되며, 콘텐츠는 신고 기반으로 운영됩니다.
        </p>
        <div className="grid grid-cols-2 gap-8 py-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-2 text-[12px] font-semibold tracking-normal text-foreground">{col.title}</h3>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-2 text-[12px] font-semibold tracking-normal text-foreground">KSCA</h3>
            <p className="text-[24px] leading-tight font-bold tracking-[-0.03em] text-foreground">student&apos;s academia.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row sm:justify-between">
          <p>Copyright © {new Date().getFullYear()} KSCA. All rights reserved.</p>
          <p>Korea Student Computer science Association</p>
        </div>
      </div>
    </footer>
  );
}
