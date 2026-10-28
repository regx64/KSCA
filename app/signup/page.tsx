import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignupForm } from '@/components/AuthForms';
import { Container } from '@/components/Container';

export const metadata: Metadata = { title: '회원가입' };

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/me');

  return (
    <Container size="narrow" className="max-w-[540px]">
      <div className="pt-16 pb-10 text-center sm:pt-24">
        <p className="eyebrow text-muted-foreground">KSCA</p>
        <h1 className="headline-lg mt-3">계정 만들기.</h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          전국 청소년 누구나 가입할 수 있어요. 이메일 인증을 마치면 논문 업로드와 글쓰기가 가능합니다.
        </p>
      </div>
      <SignupForm />
    </Container>
  );
}
