import 'server-only';
import { excerpt } from '@/lib/format';
import type { ServerSupabase } from '@/lib/supabase/server';
import type { ContentStatus, TargetType } from '@/lib/types';

export type TargetInfo = {
  title: string;
  href: string;
  status: ContentStatus;
  authorId: string;
  authorNickname: string;
  preview?: string;
};

type Ref = { target_type: TargetType; target_id: string };
type Nick = { nickname: string } | { nickname: string }[] | null;
const nick = (p: Nick) => (Array.isArray(p) ? p[0] : p)?.nickname ?? '알 수 없음';
const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);

export const targetKey = (r: Ref) => `${r.target_type}:${r.target_id}`;

// Resolves report targets (any of the four types) to a title + link, in one
// query per type. Runs through RLS, so targets the viewer can't see (e.g. a
// hidden post reported by a regular user) are simply absent from the map.
export async function resolveTargets(supabase: ServerSupabase, refs: Ref[]): Promise<Map<string, TargetInfo>> {
  const ids = (t: TargetType) => [...new Set(refs.filter((r) => r.target_type === t).map((r) => r.target_id))];
  const out = new Map<string, TargetInfo>();
  const [paperIds, postIds, commentIds, paperCommentIds] = [ids('paper'), ids('post'), ids('comment'), ids('paper_comment')];

  await Promise.all([
    paperIds.length &&
      supabase
        .from('papers')
        .select('id, concept_id, version_no, title, status, author_id, profiles(nickname)')
        .in('id', paperIds)
        .then(({ data }) => {
          for (const p of data ?? [])
            out.set(`paper:${p.id}`, {
              title: `${p.title} (v${p.version_no})`,
              href: `/papers/${p.concept_id}/v/${p.version_no}`,
              status: p.status,
              authorId: p.author_id,
              authorNickname: nick(p.profiles as Nick),
            });
        }),
    postIds.length &&
      supabase
        .from('posts')
        .select('id, title, content, status, author_id, profiles(nickname)')
        .in('id', postIds)
        .then(({ data }) => {
          for (const p of data ?? [])
            out.set(`post:${p.id}`, {
              title: p.title,
              href: `/board/post/${p.id}`,
              status: p.status,
              authorId: p.author_id,
              authorNickname: nick(p.profiles as Nick),
              preview: excerpt(p.content, 200),
            });
        }),
    commentIds.length &&
      supabase
        .from('comments')
        .select('id, post_id, content, status, author_id, profiles(nickname)')
        .in('id', commentIds)
        .then(({ data }) => {
          for (const c of data ?? [])
            out.set(`comment:${c.id}`, {
              title: excerpt(c.content, 60),
              href: `/board/post/${c.post_id}`,
              status: c.status,
              authorId: c.author_id,
              authorNickname: nick(c.profiles as Nick),
              preview: c.content,
            });
        }),
    paperCommentIds.length &&
      supabase
        .from('paper_comments')
        .select('id, content, status, author_id, profiles(nickname), papers(concept_id)')
        .in('id', paperCommentIds)
        .then(({ data }) => {
          for (const c of data ?? []) {
            const paper = one(c.papers as { concept_id: string } | { concept_id: string }[] | null);
            out.set(`paper_comment:${c.id}`, {
              title: excerpt(c.content, 60),
              href: paper ? `/papers/${paper.concept_id}` : '/papers',
              status: c.status,
              authorId: c.author_id,
              authorNickname: nick(c.profiles as Nick),
              preview: c.content,
            });
          }
        }),
  ]);
  return out;
}
