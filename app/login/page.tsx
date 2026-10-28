import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/paths';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '로그인' };

const ERRORS: Record<string, string> = {
  confirm: '이메일 확인 링크가 만료되었거나 올바르지 않습니다. 다시 로그인해 확인 메일을 요청해주세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string; confirmed?: string; email?: string; next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(next);

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold">로그인</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">KSCA 계정으로 로그인하세요.</p>
      {sp.confirm && (
        <p role="status" className="mb-4 rounded-lg border border-primary/20 bg-secondary p-3 text-sm text-secondary-foreground">
          {sp.email ? <strong>{sp.email}</strong> : '입력한 이메일'}로 가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 인증을 완료한 뒤
          로그인해주세요.
        </p>
      )}
      {sp.error && ERRORS[sp.error] && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {ERRORS[sp.error]}
        </p>
      )}
      <LoginForm next={next} email={sp.email} />
    </div>
  );
}
