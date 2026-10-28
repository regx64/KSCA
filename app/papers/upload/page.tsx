import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { loginHref } from '@/lib/paths';
import { PageHeader } from '@/components/PageHeader';
import { PaperUploadForm } from '@/components/PaperUploadForm';

export const metadata: Metadata = { title: '논문 업로드' };

export default async function PaperUploadPage() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect(loginHref('/papers/upload'));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="UPLOAD"
        title="논문 업로드"
        description="연구 논문이나 프로젝트 보고서를 PDF로 공유하세요. 업로드 즉시 게시되고 영구 식별자가 발급됩니다."
      />
      <PaperUploadForm defaults={{ title: '', authors: viewer.profile.nickname, abstract: '', tags: '', school: viewer.profile.school ?? '' }} />
    </div>
  );
}
