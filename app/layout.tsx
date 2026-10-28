import type { Metadata } from 'next';
import { Noto_Sans_KR, Noto_Serif_KR, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { getSiteUrl } from '@/lib/site';

// Korean webfonts are large, so they aren't preloaded; text renders with the
// system Korean font until they swap in.
const body = Noto_Sans_KR({ variable: '--font-body', weight: ['400', '500', '700'], preload: false, display: 'swap' });
const display = Noto_Serif_KR({ variable: '--font-display', weight: ['600', '700'], preload: false, display: 'swap' });
const code = Geist_Mono({ variable: '--font-code', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'KSCA — 전국 청소년 컴퓨터 사이언스 학회', template: '%s · KSCA' },
  description: '전국 청소년 누구나 연구를 공유하고 인용하고 토론하는 컴퓨터 사이언스 논문 아카이브와 커뮤니티.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${body.variable} ${display.variable} ${code.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          본문으로 건너뛰기
        </a>
        <Nav />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
