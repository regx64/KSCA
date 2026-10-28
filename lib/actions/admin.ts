'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { AdminRequiredError, AuthRequiredError, requireAdmin } from '@/lib/auth';
import { applyResolution, isDecision } from '@/lib/moderation';
import { toUserMessage } from '@/lib/errors';
import { isUuid, isValidTargetType } from '@/lib/validation';
import type { ActionState } from '@/lib/types';

// README §11: 삭제 확정 (confirm → stays hidden) / 복구 (restore → public).
// Also used for admins' direct hide/restore on content pages (README §2:
// 콘텐츠 강제 삭제/복구); either way every pending report on the target closes.
export async function resolveReport(targetType: string, targetId: string, decision: string): Promise<ActionState> {
  if (!isValidTargetType(targetType) || !isUuid(targetId) || !isDecision(decision)) return { error: '잘못된 요청입니다.' };

  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    if (e instanceof AuthRequiredError || e instanceof AdminRequiredError) return { error: '운영진만 처리할 수 있습니다.' };
    throw e;
  }

  const { error } = await applyResolution(supabase, targetType, targetId, decision);
  if (error) return { error: toUserMessage(error, '처리하지 못했습니다.') };

  revalidatePath('/', 'layout');
  return { ok: true, message: decision === 'confirm' ? '비공개 처리를 확정했습니다.' : '콘텐츠를 공개로 복구했습니다.' };
}
