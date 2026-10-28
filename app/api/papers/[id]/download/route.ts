import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/validation';

const SIGNED_URL_TTL_SECONDS = 300; // README §7: 짧은 만료시간 (5분)

// GET /api/papers/[id]/download[?inline=1]
// Looks the paper up through RLS (hidden papers only reach author/admin),
// mints a fresh short-lived signed URL, and redirects to it. Signed URLs are
// never stored.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const supabase = await createClient();
  const { data: paper } = await supabase
    .from('papers')
    .select('file_path, concept_id, version_no')
    .eq('id', id)
    .maybeSingle();
  if (!paper) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const inline = request.nextUrl.searchParams.get('inline') === '1';
  const { data, error } = await createAdminClient()
    .storage.from('papers')
    .createSignedUrl(paper.file_path, SIGNED_URL_TTL_SECONDS, {
      download: inline ? undefined : `${paper.concept_id}-v${paper.version_no}.pdf`,
    });
  if (error || !data) return NextResponse.json({ error: 'file unavailable' }, { status: 502 });

  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}
