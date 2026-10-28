import type { Metadata } from 'next';
import { PaperDetail } from '@/components/PaperDetail';
import { getPaperVersions } from '@/lib/papers';
import { excerpt } from '@/lib/format';

type Props = { params: Promise<{ concept_id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { concept_id } = await params;
  const [latest] = await getPaperVersions(concept_id);
  if (!latest) return { title: '논문을 찾을 수 없습니다' };
  return { title: latest.title, description: excerpt(latest.abstract, 160) };
}

export default async function PaperPage({ params }: Props) {
  const { concept_id } = await params;
  return <PaperDetail conceptId={concept_id} />;
}
