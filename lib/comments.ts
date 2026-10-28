import type { ContentStatus } from '@/lib/types';

export type ThreadComment = {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  createdAt: string;
  status: ContentStatus;
  // Paper comments only: the version the comment was written on (README §3.4).
  version?: number;
};

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  status: ContentStatus;
  written_at_version?: number;
  profiles?: { nickname: string } | { nickname: string }[] | null;
};

function nicknameOf(p: CommentRow['profiles']): string {
  const profile = Array.isArray(p) ? p[0] : p;
  return profile?.nickname ?? '알 수 없음';
}

// Normalizes comment rows (board or paper, joined with profiles) into one
// shape, oldest first. Paper comments from every version of a concept are
// merged into a single thread, each keeping its own version badge.
export function toThreadComments(rows: CommentRow[]): ThreadComment[] {
  return rows
    .map((r) => ({
      id: r.id,
      authorId: r.author_id,
      authorNickname: nicknameOf(r.profiles),
      content: r.content,
      createdAt: r.created_at,
      status: r.status,
      ...(r.written_at_version !== undefined ? { version: r.written_at_version } : {}),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
