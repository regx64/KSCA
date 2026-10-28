import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/paths';
import { LoginForm, ResendConfirmationForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '로그인' };

const ERRORS: Record<string, string> = {
  // Confirmation links are single-use; mail scanners (e.g. Gmail) often open
  // them first, so the account may already be verified when the user clicks.
  confirm:
    '이메일 확인 링크가 만료되었거나 이미 사용되었습니다. 메일 보안 검사가 링크를 먼저 열었다면 인증은 이미 끝났을 수 있으니, 먼저 로그인해 보세요. 로그인이 안 되면 아래에서 확인 메일을 다시 받으세요.',
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
        <div className="mb-4 space-y-3">
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {ERRORS[sp.error]}
          </p>
          {sp.error === 'confirm' && <ResendConfirmationForm email={sp.email} />}
        </div>
      )}
      <LoginForm next={next} email={sp.email} />
    </div>
  );
}
