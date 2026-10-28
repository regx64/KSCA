import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { getSiteUrl } from '@/lib/site';

const code = Geist_Mono({ variable: '--font-code', subsets: ['latin'] });

// Pretendard (Korean + Latin, SF Pro–like), served as unicode-range subsets
// so a page only downloads the glyph chunks it actually uses.
const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "KSCA — student's academia.", template: '%s · KSCA' },
  description: "student's academia. 전국 청소년의 컴퓨터 사이언스 연구가 기록되고, 인용되는 곳.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${code.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-[14px] focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
