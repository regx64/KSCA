import Link from 'next/link';
import { loginHref } from '@/lib/paths';

export function LoginPrompt({ next, action }: { next: string; action: string }) {
  return (
    <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
      <Link href={loginHref(next)} className="font-medium text-primary underline underline-offset-4">
        로그인
      </Link>
      하면 {action} 수 있습니다.
    </p>
  );
}
