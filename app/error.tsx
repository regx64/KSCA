'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-5 py-28 text-center sm:py-36">
      <h1 className="headline-lg">문제가 발생했습니다.</h1>
      <p className="subhead mt-5 text-muted-foreground">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
      {error.digest && <p className="mt-3 font-mono text-[12px] text-muted-foreground">오류 코드: {error.digest}</p>}
      <Button size="lg" className="mt-9" onClick={reset}>
        다시 시도
      </Button>
    </div>
  );
}
