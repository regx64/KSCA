'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { canPostToCategory, isValidCategory } from '@/lib/board';
import { toUserMessage } from '@/lib/errors';
import { parseTags, validatePostFields } from '@/lib/validation';
import type { ActionState } from '@/lib/types';

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const category = String(formData.get('category') ?? '');
  if (!isValidCategory(category)) return { error: '카테고리를 선택해주세요.' };

  const fields = {
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim(),
    tags: parseTags(String(formData.get('tags') ?? '')),
  };
  const check = validatePostFields(fields);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) return { error: '로그인이 필요합니다.' };
  // UX check; the posts_insert RLS policy is the real gate for notice.
  if (!canPostToCategory(category, viewer.profile.role)) return { error: '공지는 운영진만 작성할 수 있습니다.' };

  const { data, error } = await supabase
    .from('posts')
    .insert({ category, author_id: viewer.user.id, ...fields })
    .select('id')
    .single();
  if (error || !data) return { error: toUserMessage(error, '게시글을 등록하지 못했습니다.') };

  revalidatePath('/board', 'layout');
  redirect(`/board/post/${data.id}`);
}
