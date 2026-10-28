'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toUserMessage } from '@/lib/errors';
import { CONCEPT_ID_RE, optionalText, parseTags, validatePaperFields, validateUpload } from '@/lib/validation';

type UploadTicket = { ok: true; path: string; token: string } | { ok: false; error: string };

// Step 1 of README §7's upload flow: validate, then mint a signed upload URL
// for a fresh path under the uploader's own folder. The browser uploads the
// file straight to Storage with the returned token.
export async function requestPaperUpload(file: { fileName: string; fileSize: number; fileType: string }): Promise<UploadTicket> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: '로그인이 필요합니다.' };

  const check = validateUpload(file);
  if (!check.ok) return { ok: false, error: check.error };

  const path = `${data.user.id}/${randomUUID()}.pdf`;
  const { data: signed, error } = await createAdminClient().storage.from('papers').createSignedUploadUrl(path);
  if (error || !signed) return { ok: false, error: '업로드 URL을 발급하지 못했습니다. 잠시 후 다시 시도해주세요.' };
  return { ok: true, path, token: signed.token };
}

export type CreatePaperInput = {
  title: string;
  authors: string;
  abstract: string;
  tags: string;
  school: string;
  filePath: string;
  existingConceptId?: string;
};

type CreatePaperResult = { ok: true; conceptId: string; versionNo: number } | { ok: false; error: string };

// Step 2: after the browser's upload succeeds, record the paper row. A first
// version gets a new concept_id from generate_concept_id(); a new version
// reuses the concept_id and the DB assigns version_no (migration 0006 §5).
export async function createPaper(input: CreatePaperInput): Promise<CreatePaperResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: '로그인이 필요합니다.' };
  const userId = auth.user.id;

  const fields = {
    title: input.title.trim(),
    authors: input.authors.trim(),
    abstract: input.abstract.trim(),
    tags: parseTags(input.tags),
    school: optionalText(input.school),
  };
  const check = validatePaperFields(fields);
  if (!check.ok) return { ok: false, error: check.error };

  // The file must be one this user just uploaded via their own signed URL.
  const pathRe = new RegExp(`^${userId}/[0-9a-f-]{36}\\.pdf$`);
  if (!pathRe.test(input.filePath)) return { ok: false, error: '잘못된 파일 경로입니다.' };
  const admin = createAdminClient();
  const { data: exists } = await admin.storage.from('papers').exists(input.filePath);
  if (!exists) return { ok: false, error: '업로드된 파일을 찾을 수 없습니다. 다시 업로드해주세요.' };

  let conceptId: string;
  if (input.existingConceptId) {
    if (!CONCEPT_ID_RE.test(input.existingConceptId)) return { ok: false, error: '잘못된 논문 식별자입니다.' };
    const { data: latest } = await supabase
      .from('papers')
      .select('author_id')
      .eq('concept_id', input.existingConceptId)
      .limit(1)
      .maybeSingle();
    if (!latest) return { ok: false, error: '논문을 찾을 수 없습니다.' };
    if (latest.author_id !== userId) return { ok: false, error: '원저자만 새 버전을 업로드할 수 있습니다.' };
    conceptId = input.existingConceptId;
  } else {
    const { data, error } = await supabase.rpc('generate_concept_id');
    if (error || typeof data !== 'string') return { ok: false, error: '논문 식별자를 발급하지 못했습니다.' };
    conceptId = data;
  }

  const { data: row, error } = await supabase
    .from('papers')
    .insert({ concept_id: conceptId, author_id: userId, file_path: input.filePath, ...fields })
    .select('version_no')
    .single();
  if (error || !row) {
    await admin.storage.from('papers').remove([input.filePath]);
    return { ok: false, error: toUserMessage(error, '논문을 등록하지 못했습니다.') };
  }

  revalidatePath('/', 'layout');
  return { ok: true, conceptId, versionNo: row.version_no };
}

// Discards an uploaded file whose metadata step was abandoned.
export async function discardUpload(path: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !path.startsWith(`${data.user.id}/`)) return;
  const { count } = await supabase.from('papers').select('id', { count: 'exact', head: true }).eq('file_path', path);
  if (count) return;
  await createAdminClient().storage.from('papers').remove([path]);
}
