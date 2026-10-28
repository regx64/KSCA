'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { toUserMessage } from '@/lib/errors';
import { isUuid, isValidTargetType, validateReport } from '@/lib/validation';
import type { ActionState } from '@/lib/types';

// Files a report (README §3.5). The app only inserts; auto-hiding at 3 pending
// reports happens in the DB trigger (README §10).
export async function submitReport(input: {
  targetType: string;
  targetId: string;
  reason: string;
  detail?: string;
}): Promise<ActionState> {
  if (!isValidTargetType(input.targetType) || !isUuid(input.targetId)) return { error: '잘못된 신고 대상입니다.' };
  const detail = input.detail?.trim() || null;
  const check = validateReport({ reason: input.reason, detail });
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: '로그인이 필요합니다.' };

  const { error } = await supabase.from('reports').insert({
    target_type: input.targetType,
    target_id: input.targetId,
    reporter_id: data.user.id,
    reason: input.reason,
    detail,
  });
  if (error) {
    if (error.code === '23505') return { error: '이미 신고한 콘텐츠입니다. 운영진이 검토할 예정입니다.' };
    return { error: toUserMessage(error, '신고를 접수하지 못했습니다.') };
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: '신고가 접수되었습니다. 신고가 3건 누적되면 자동으로 비공개 처리됩니다.' };
}
