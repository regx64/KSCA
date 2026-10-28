'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resendConfirmation, signIn, signUp, updateProfile } from '@/lib/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { FormMessage } from '@/components/FormMessage';

export function LoginForm({ next, email }: { next: string; email?: string }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="sr-only">
            이메일
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={email} placeholder="이메일" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            비밀번호
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="비밀번호" className="field" />
        </div>
        <FormMessage state={{ error: state.error }} />
        <SubmitButton className="w-full" size="lg" pendingLabel="로그인 중…">
          로그인
        </SubmitButton>
      </form>
      {state.message === 'unconfirmed' && <ResendConfirmationForm email={email} />}
      <p className="text-center text-[14px] text-muted-foreground">
        KSCA 계정이 없으신가요?{' '}
        <Link href="/signup" className="link-chevron">
          지금 만들기
        </Link>
      </p>
    </div>
  );
}

export function ResendConfirmationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendConfirmation, {});
  return (
    <form action={action} className="space-y-3 rounded-[18px] bg-surface p-5">
      <p className="text-[14px] font-semibold">확인 메일을 받지 못했나요?</p>
      <div className="flex gap-2">
        <label htmlFor="resend-email" className="sr-only">
          이메일
        </label>
        <input id="resend-email" name="email" type="email" required defaultValue={email} placeholder="이메일" className="field h-10 text-[15px]" />
        <SubmitButton variant="outline" pendingLabel="전송 중…" className="h-10 shrink-0">
          다시 보내기
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, {});
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nickname" className="field-label">
            닉네임
          </label>
          <input id="nickname" name="nickname" required maxLength={30} autoComplete="nickname" className="field" />
        </div>
        <div>
          <label htmlFor="school" className="field-label">
            학교 <span className="font-normal text-muted-foreground">(선택)</span>
          </label>
          <input id="school" name="school" maxLength={100} className="field" />
        </div>
      </div>
      <p className="-mt-2 text-[12px] text-muted-foreground">학교 인증은 없으며, 자유롭게 입력합니다.</p>
      <div>
        <label htmlFor="email" className="field-label">
          이메일
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        <p className="field-hint">이 주소로 확인 메일이 발송됩니다.</p>
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          비밀번호
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
        <p className="field-hint">8자 이상</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full" size="lg" pendingLabel="가입 중…">
        가입하기
      </SubmitButton>
      <p className="text-center text-[14px] text-muted-foreground">
        이미 계정이 있나요?{' '}
        <Link href="/login" className="link-chevron">
          로그인
        </Link>
      </p>
    </form>
  );
}

export function ProfileForm({ nickname, school }: { nickname: string; school: string | null }) {
  const [state, action] = useActionState(updateProfile, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="nickname" className="field-label">
          닉네임
        </label>
        <input id="nickname" name="nickname" required maxLength={30} defaultValue={nickname} className="field" />
      </div>
      <div>
        <label htmlFor="school" className="field-label">
          학교 <span className="font-normal text-muted-foreground">(선택)</span>
        </label>
        <input id="school" name="school" maxLength={100} defaultValue={school ?? ''} className="field" />
      </div>
      <SubmitButton pendingLabel="저장 중…" className="h-12">
        저장
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
