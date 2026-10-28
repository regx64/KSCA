'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { createPaper, requestPaperUpload } from '@/lib/actions/papers';
import { createClient } from '@/lib/supabase/client';
import { MAX_TAGS, validateUpload } from '@/lib/validation';
import { Button } from '@/components/ui/button';

type Defaults = { title: string; authors: string; abstract: string; tags: string; school: string };
type Phase = 'idle' | 'uploading' | 'saving';

// README §7 signed upload: (1) server validates + mints a signed upload URL,
// (2) the browser PUTs the PDF straight to the private bucket, (3) the server
// records the paper row. Used for first uploads and for new versions.
export function PaperUploadForm({
  existingConceptId,
  defaults,
}: {
  existingConceptId?: string;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setError('PDF 파일을 선택해주세요.');
      return;
    }
    const check = validateUpload({ fileName: file.name, fileSize: file.size, fileType: file.type });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    try {
      setPhase('uploading');
      const ticket = await requestPaperUpload({ fileName: file.name, fileSize: file.size, fileType: file.type });
      if (!ticket.ok) throw new Error(ticket.error);

      const { error: uploadError } = await createClient()
        .storage.from('papers')
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: 'application/pdf' });
      if (uploadError) throw new Error('파일 업로드에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');

      setPhase('saving');
      const result = await createPaper({
        title: String(form.get('title') ?? ''),
        authors: String(form.get('authors') ?? ''),
        abstract: String(form.get('abstract') ?? ''),
        tags: String(form.get('tags') ?? ''),
        school: String(form.get('school') ?? ''),
        filePath: ticket.path,
        existingConceptId,
      });
      if (!result.ok) throw new Error(result.error);

      toast.success(
        existingConceptId ? `v${result.versionNo}이 등록되었습니다.` : `${result.conceptId}로 등록되었습니다.`
      );
      router.push(`/papers/${result.conceptId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';

  return (
    <form onSubmit={onSubmit} className="space-y-8" aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-6">
        <div>
          <label htmlFor="title" className="field-label">
            제목
          </label>
          <input id="title" name="title" required maxLength={300} defaultValue={defaults.title} className="field" />
        </div>
        <div>
          <label htmlFor="authors" className="field-label">
            저자명
          </label>
          <input
            id="authors"
            name="authors"
            required
            maxLength={500}
            defaultValue={defaults.authors}
            placeholder="본인과 공동저자를 쉼표로 구분 (예: 김민준, 정하은)"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="abstract" className="field-label">
            초록
          </label>
          <textarea id="abstract" name="abstract" required rows={8} maxLength={5000} defaultValue={defaults.abstract} className="field" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="tags" className="field-label">
              분야 태그
            </label>
            <input id="tags" name="tags" defaultValue={defaults.tags} placeholder="AI, 데이터분석" className="field" />
            <p className="field-hint">쉼표로 구분, 최대 {MAX_TAGS}개</p>
          </div>
          <div>
            <label htmlFor="school" className="field-label">
              학교명 <span className="font-normal text-muted-foreground">(선택)</span>
            </label>
            <input id="school" name="school" maxLength={100} defaultValue={defaults.school} className="field" />
            <p className="field-hint">학교 인증 없이 자유롭게 입력합니다.</p>
          </div>
        </div>
        <div>
          <span className="field-label">PDF 파일</span>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] bg-surface px-6 py-12 text-center transition hover:bg-[#ececf0] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20"
          >
            <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <UploadCloud className="size-6 text-primary" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="mt-4 text-[17px] font-semibold">{fileName ?? 'PDF 파일을 선택하세요'}</span>
            <span className="mt-1 text-[13px] text-muted-foreground">{fileName ? '다른 파일을 고르려면 다시 누르세요' : 'PDF만 가능 · 최대 20MB'}</span>
            <input
              id="file"
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              required
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-xl bg-[#fde8e8] px-4 py-3 text-[14px] text-[#86000a]">
          {error}
        </p>
      )}

      <div className="space-y-4 border-t border-border pt-8">
        <Button type="submit" disabled={busy} size="lg" className="w-full sm:w-auto">
          {phase === 'uploading' ? 'PDF 업로드 중…' : phase === 'saving' ? '등록 중…' : existingConceptId ? '새 버전 등록' : '업로드'}
        </Button>
        <p className="text-[13px] text-muted-foreground">
          {existingConceptId
            ? '식별자는 그대로 유지되고 버전 번호만 올라갑니다. 이전 버전은 계속 열람할 수 있습니다.'
            : '사전 승인 없이 바로 게시되며, 영구 식별자(KSCA-연도-번호)가 발급됩니다.'}
        </p>
      </div>
    </form>
  );
}
