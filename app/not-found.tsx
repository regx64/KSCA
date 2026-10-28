import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        주소가 잘못되었거나, 삭제 또는 비공개 처리된 콘텐츠일 수 있습니다.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className={buttonVariants()}>
          홈으로
        </Link>
        <Link href="/papers" className={buttonVariants({ variant: 'outline' })}>
          아카이브
        </Link>
      </div>
    </div>
  );
}
