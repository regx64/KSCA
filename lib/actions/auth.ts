'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site';
import { safeNextPath } from '@/lib/paths';
import { optionalText, parseSignupForm, validateProfileFields, validateSignup } from '@/lib/validation';
import { toUserMessage } from '@/lib/errors';
import type { ActionState } from '@/lib/types';

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fields = parseSignupForm(formData);
  const check = validateSignup(fields);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      // README §2: 이메일 인증 필수 — the link lands on /auth/confirm.
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/me`,
      data: { nickname: fields.nickname, school: fields.school },
    },
  });
  if (error) {
    if (error.code === 'user_already_exists') return { error: '이미 가입된 이메일입니다. 로그인해주세요.' };
    if (error.code === 'weak_password') return { error: '더 안전한 비밀번호를 사용해주세요.' };
    if (error.code === 'over_email_send_rate_limit') return { error: '잠시 후 다시 시도해주세요.' };
    return { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
  redirect(`/login?confirm=1&email=${encodeURIComponent(fields.email)}`);
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(String(formData.get('next') ?? ''));
  if (!email || !password) return { error: '이메일과 비밀번호를 입력해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: '이메일 인증이 완료되지 않았습니다. 받은 편지함의 확인 링크를 눌러주세요.', message: 'unconfirmed' };
    }
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }
  revalidatePath('/', 'layout');
  redirect(next);
}

export async function resendConfirmation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: '이메일을 입력해주세요.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/me` },
  });
  if (error) return { error: '확인 메일을 다시 보내지 못했습니다. 잠시 후 다시 시도해주세요.' };
  return { ok: true, message: '확인 메일을 다시 보냈습니다.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fields = { nickname: String(formData.get('nickname') ?? '').trim(), school: optionalText(formData.get('school')) };
  const check = validateProfileFields(fields);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: '로그인이 필요합니다.' };

  const { error } = await supabase.from('profiles').update(fields).eq('id', data.user.id);
  if (error) return { error: toUserMessage(error) };
  revalidatePath('/', 'layout');
  return { ok: true, message: '프로필을 저장했습니다.' };
}
