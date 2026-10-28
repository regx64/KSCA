import Link from 'next/link';
import { loginHref } from '@/lib/paths';

export function LoginPrompt({ next, action }: { next: string; action: string }) {
  return (
    <p className="rounded-[18px] bg-surface px-5 py-4 text-[15px] text-muted-foreground">
      <Link href={loginHref(next)} className="text-link hover:underline">
        로그인
      </Link>
      하면 {action} 수 있습니다.
    </p>
  );
}
