import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-28 text-center sm:py-36">
      <p className="eyebrow text-muted-foreground">404</p>
      <h1 className="headline-lg mt-3">페이지를 찾을 수 없습니다.</h1>
      <p className="subhead mt-5 text-muted-foreground">주소가 잘못되었거나, 삭제 또는 비공개 처리된 콘텐츠일 수 있습니다.</p>
      <div className="mt-9 flex justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: 'lg' })}>
          홈으로
        </Link>
        <Link href="/papers" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          아카이브
        </Link>
      </div>
    </div>
  );
}
