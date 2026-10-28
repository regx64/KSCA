import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignupForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '회원가입' };

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/me');

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        전국 청소년 누구나 가입할 수 있어요. 가입 후 이메일 인증을 완료하면 논문 업로드와 글쓰기가 가능합니다.
      </p>
      <SignupForm />
    </div>
  );
}
