'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { resendConfirmation, signIn, signUp, updateProfile } from '@/lib/actions/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/SubmitButton';
import { FormMessage } from '@/components/FormMessage';

const field = 'h-10 bg-card';

export function LoginForm({ next, email }: { next: string; email?: string }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={email} className={field} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
        </div>
        <FormMessage state={{ error: state.error }} />
        <SubmitButton className="w-full" size="lg" pendingLabel="로그인 중…">
          로그인
        </SubmitButton>
      </form>
      {state.message === 'unconfirmed' && <ResendConfirmationForm email={email} />}
      <p className="text-center text-sm text-muted-foreground">
        아직 회원이 아니신가요?{' '}
        <Link href="/signup" className="font-medium text-primary underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export function ResendConfirmationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendConfirmation, {});
  return (
    <form action={action} className="space-y-2 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">확인 메일을 받지 못했나요?</p>
      <div className="flex gap-2">
        <label htmlFor="resend-email" className="sr-only">
          이메일
        </label>
        <Input id="resend-email" name="email" type="email" required defaultValue={email} className="h-8 bg-card" />
        <SubmitButton size="sm" variant="outline" pendingLabel="전송 중…">
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
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nickname">닉네임</Label>
        <Input id="nickname" name="nickname" required maxLength={30} autoComplete="nickname" className={field} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="school">학교 (선택)</Label>
        <Input id="school" name="school" maxLength={100} className={field} />
        <p className="text-xs text-muted-foreground">학교 인증은 없으며, 자유롭게 입력합니다.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
        <p className="text-xs text-muted-foreground">8자 이상</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full" size="lg" pendingLabel="가입 중…">
        가입하기
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{' '}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
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
      <div className="space-y-1.5">
        <Label htmlFor="nickname">닉네임</Label>
        <Input id="nickname" name="nickname" required maxLength={30} defaultValue={nickname} className="h-9 bg-card" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="school">학교 (선택)</Label>
        <Input id="school" name="school" maxLength={100} defaultValue={school ?? ''} className="h-9 bg-card" />
      </div>
      <SubmitButton pendingLabel="저장 중…" className="h-9">
        저장
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
