import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { getPaperVersions } from '@/lib/papers';
import { loginHref } from '@/lib/paths';
import { PageHeader } from '@/components/PageHeader';
import { Container } from '@/components/Container';
import { PaperUploadForm } from '@/components/PaperUploadForm';

export const metadata: Metadata = { title: '새 버전 업로드' };

// README §5: 새 버전 업로드 (원저자만). The DB enforces the same rule
// (migration 0006 §5); this page just avoids showing the form to others.
export default async function UploadVersionPage({ params }: { params: Promise<{ concept_id: string }> }) {
  const { concept_id } = await params;
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect(loginHref(`/papers/${concept_id}/upload-version`));

  const [latest] = await getPaperVersions(concept_id);
  if (!latest) notFound();
  if (latest.author_id !== viewer.user.id) redirect(`/papers/${concept_id}`);

  return (
    <Container size="narrow">
      <PageHeader
        align="center"
        eyebrow={`${latest.concept_id} · 현재 v${latest.version_no}`}
        title={`v${latest.version_no + 1} 업로드.`}
        description={
          <>
            <Link href={`/papers/${concept_id}`} className="text-link hover:underline">
              {latest.title}
            </Link>
            의 v{latest.version_no + 1}을 등록합니다. 아래 내용은 현재 버전에서 가져왔으니 바뀐 부분만 수정하세요.
          </>
        }
      />
      <PaperUploadForm
        existingConceptId={concept_id}
        defaults={{
          title: latest.title,
          authors: latest.authors,
          abstract: latest.abstract,
          tags: latest.tags.join(', '),
          school: latest.school ?? '',
        }}
      />
    </Container>
  );
}
