'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { toUserMessage } from '@/lib/errors';
import { isUuid, validateCommentContent } from '@/lib/validation';
import type { ActionState } from '@/lib/types';

// Paper comment on a specific version row. The "v_N에 작성됨" badge value is
// set by the DB from that row (migration 0006 §6), not sent by the client.
export async function addPaperComment(paperId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  return addComment('paper_comments', { paper_id: paperId }, paperId, formData);
}

// Board comment (single level, README §4).
export async function addBoardComment(postId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  return addComment('comments', { post_id: postId }, postId, formData);
}

async function addComment(
  table: 'paper_comments' | 'comments',
  parent: Record<string, string>,
  parentId: string,
  formData: FormData
): Promise<ActionState> {
  if (!isUuid(parentId)) return { error: '잘못된 요청입니다.' };
  const content = String(formData.get('content') ?? '');
  const check = validateCommentContent(content);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: '로그인이 필요합니다.' };

  const { error } = await supabase.from(table).insert({ ...parent, author_id: data.user.id, content: content.trim() });
  if (error) return { error: toUserMessage(error, '댓글을 등록하지 못했습니다.') };

  revalidatePath(table === 'comments' ? '/board/post/[id]' : '/papers/[concept_id]', 'page');
  return { ok: true };
}
