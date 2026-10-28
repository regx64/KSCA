// APA and BibTeX citations for a paper version (README §3.2).
// The URL cites the concept_id (the permanent identifier, Zenodo's "concept
// DOI" equivalent); the version number is stated explicitly.
import { yearOf } from '@/lib/format';

export type CitationInput = {
  concept_id: string;
  version_no: number;
  authors: string;
  title: string;
  created_at: string;
};

// The production domain isn't registered yet (README §14), so the base URL
// comes from NEXT_PUBLIC_SITE_URL with a placeholder fallback.
export const DEFAULT_BASE_URL = 'https://ksca.dev';

export function paperUrl(conceptId: string, baseUrl: string = DEFAULT_BASE_URL): string {
  return `${baseUrl.replace(/\/+$/, '')}/papers/${conceptId}`;
}

// "김민준, 정하은" / "김민준·정하은" / "김민준 and 정하은" → ['김민준', '정하은']
export function splitAuthors(authors: string): string[] {
  return authors
    .split(/\s*(?:,|，|·|;|\band\b|&)\s*/)
    .map((a) => a.trim())
    .filter(Boolean);
}

function apaAuthors(list: string[]): string {
  if (list.length === 0) return 'KSCA';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]}, & ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, & ${list[list.length - 1]}`;
}

export function formatAPA(p: CitationInput, baseUrl: string = DEFAULT_BASE_URL): string {
  const title = p.title.trim().replace(/[.。]+$/, '');
  return `${apaAuthors(splitAuthors(p.authors))} (${yearOf(p.created_at)}). ${title} (Version ${p.version_no}) [Preprint]. KSCA. ${paperUrl(p.concept_id, baseUrl)}`;
}

function bibEscape(s: string): string {
  return s.replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
}

export function bibtexKey(p: Pick<CitationInput, 'concept_id' | 'version_no'>): string {
  return `${p.concept_id}v${p.version_no}`;
}

export function formatBibTeX(p: CitationInput, baseUrl: string = DEFAULT_BASE_URL): string {
  const authors = splitAuthors(p.authors).map(bibEscape).join(' and ') || 'KSCA';
  return [
    `@misc{${bibtexKey(p)},`,
    `  author = {${authors}},`,
    `  title = {{${bibEscape(p.title.trim())}}},`,
    `  year = {${yearOf(p.created_at)}},`,
    `  version = {${p.version_no}},`,
    `  publisher = {KSCA},`,
    `  note = {${p.concept_id}},`,
    `  url = {${paperUrl(p.concept_id, baseUrl)}}`,
    `}`,
  ].join('\n');
}
