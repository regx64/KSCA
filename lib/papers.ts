import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { CONCEPT_ID_RE } from '@/lib/validation';
import type { Paper } from '@/lib/types';

// All versions of a concept visible to the current viewer (RLS-filtered),
// newest first. Cached per request so generateMetadata and the page share it.
export const getPaperVersions = cache(async (conceptId: string): Promise<Paper[]> => {
  if (!CONCEPT_ID_RE.test(conceptId)) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('papers')
    .select('*')
    .eq('concept_id', conceptId)
    .order('version_no', { ascending: false });
  return (data ?? []) as Paper[];
});
