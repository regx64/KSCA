'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { createPaper, requestPaperUpload } from '@/lib/actions/papers';
import { createClient } from '@/lib/supabase/client';
import { MAX_TAGS, validateUpload } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required maxLength={300} defaultValue={defaults.title} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="authors">저자명</Label>
          <Input
            id="authors"
            name="authors"
            required
            maxLength={500}
            defaultValue={defaults.authors}
            placeholder="본인과 공동저자를 쉼표로 구분 (예: 김민준, 정하은)"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="abstract">초록</Label>
          <Textarea id="abstract" name="abstract" required rows={8} maxLength={5000} defaultValue={defaults.abstract} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tags">분야 태그</Label>
            <Input id="tags" name="tags" defaultValue={defaults.tags} placeholder="AI, 데이터분석" />
            <p className="text-xs text-muted-foreground">쉼표로 구분, 최대 {MAX_TAGS}개</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school">학교명 (선택)</Label>
            <Input id="school" name="school" maxLength={100} defaultValue={defaults.school} />
            <p className="text-xs text-muted-foreground">학교 인증 없이 자유롭게 입력합니다.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="file">PDF 파일</Label>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-8 text-center transition hover:border-primary/40 hover:bg-primary/5"
          >
            <UploadCloud className="size-7 text-primary" aria-hidden />
            <span className="text-sm font-medium">{fileName ?? 'PDF 파일을 선택하세요'}</span>
            <span className="text-xs text-muted-foreground">PDF만 가능 · 최대 20MB</span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy} size="lg">
          {phase === 'uploading' ? 'PDF 업로드 중…' : phase === 'saving' ? '등록 중…' : existingConceptId ? '새 버전 등록' : '업로드'}
        </Button>
        <p className="text-xs text-muted-foreground">
          {existingConceptId
            ? '식별자는 그대로 유지되고 버전 번호만 올라갑니다. 이전 버전은 계속 열람할 수 있습니다.'
            : '사전 승인 없이 바로 게시되며, 영구 식별자(KSCA-연도-번호)가 발급됩니다.'}
        </p>
      </div>
    </form>
  );
}
