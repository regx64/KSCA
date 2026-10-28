// Mirrors the papers_select / posts_select / comments_select /
// paper_comments_select RLS policies (README §12) for UI-level decisions:
// render "not found" instead of a broken page, show moderation banners.
// RLS is the actual security boundary.
import type { ContentStatus, Role } from '@/lib/types';

type ViewableContent = { status: ContentStatus; author_id: string };

export function canView(content: ViewableContent, viewerId: string | null, viewerRole: Role | null): boolean {
  if (content.status === 'public') return true;
  if (viewerId && content.author_id === viewerId) return true;
  return viewerRole === 'admin';
}
