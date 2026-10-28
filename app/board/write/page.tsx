import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/auth';
import { isValidCategory, writableCategories } from '@/lib/board';
import { loginHref } from '@/lib/paths';
import { PageHeader } from '@/components/PageHeader';
import { PostForm } from '@/components/PostForm';

export const metadata: Metadata = { title: '글쓰기' };

export default async function BoardWritePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  if (!viewer) redirect(loginHref(category ? `/board/write?category=${category}` : '/board/write'));

  // 공지(notice) is only offered to admins (README §4); RLS enforces it too.
  const categories = writableCategories(viewer.profile.role);
  const initial = category && isValidCategory(category) && categories.includes(category) ? category : 'free';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="COMMUNITY" title="글쓰기" />
      <PostForm categories={categories} initialCategory={initial} />
    </div>
  );
}
