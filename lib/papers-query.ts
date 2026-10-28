import { parsePage } from '@/lib/pagination';

export type PaperSort = 'latest' | 'views';
export type PaperListParams = { sort: PaperSort; tag: string | null; q: string | null; page: number };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// README §3.3: 최신순 / 조회수순 / 태그 필터 (+ title search and pagination)
export function parsePaperListParams(sp: SearchParams): PaperListParams {
  const sort = first(sp.sort) === 'views' ? 'views' : 'latest';
  const tag = first(sp.tag)?.trim() || null;
  const q = first(sp.q)?.trim().slice(0, 100) || null;
  return { sort, tag, q, page: parsePage(sp.page) };
}

// Builds a /papers URL, dropping defaults so links stay canonical.
export function paperListHref(params: Partial<PaperListParams>): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.tag) sp.set('tag', params.tag);
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const s = sp.toString();
  return s ? `/papers?${s}` : '/papers';
}

// Escapes LIKE wildcards so a search for "100%" matches literally.
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
