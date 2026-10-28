'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">오류 코드: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        다시 시도
      </Button>
    </div>
  );
}
