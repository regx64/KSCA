import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaperDetail } from '@/components/PaperDetail';
import { getPaperVersions } from '@/lib/papers';

type Props = { params: Promise<{ concept_id: string; n: string }> };

function parseVersion(n: string): number | null {
  return /^[1-9]\d{0,5}$/.test(n) ? Number(n) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { concept_id, n } = await params;
  const version = parseVersion(n);
  const paper = (await getPaperVersions(concept_id)).find((v) => v.version_no === version);
  return { title: paper ? `${paper.title} (v${paper.version_no})` : '논문을 찾을 수 없습니다' };
}

export default async function PaperVersionPage({ params }: Props) {
  const { concept_id, n } = await params;
  const version = parseVersion(n);
  if (version === null) notFound();
  return <PaperDetail conceptId={concept_id} version={version} />;
}
