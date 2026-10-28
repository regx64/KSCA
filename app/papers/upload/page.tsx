import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { loginHref } from '@/lib/paths';
import { Container } from '@/components/Container';
import { PageHeader } from '@/components/PageHeader';
import { PaperUploadForm } from '@/components/PaperUploadForm';

export const metadata: Metadata = { title: '논문 업로드' };

export default async function PaperUploadPage() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect(loginHref('/papers/upload'));

  return (
    <Container size="narrow">
      <PageHeader
        align="center"
        eyebrow="논문 업로드"
        title="당신의 연구를 기록하세요."
        description="PDF를 올리면 바로 게시되고, 영구 식별자가 발급됩니다."
      />
      <PaperUploadForm defaults={{ title: '', authors: viewer.profile.nickname, abstract: '', tags: '', school: viewer.profile.school ?? '' }} />
    </Container>
  );
}
