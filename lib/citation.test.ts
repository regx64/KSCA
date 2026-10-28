import { describe, it, expect } from 'vitest';
import { formatAPA, formatBibTeX, splitAuthors, paperUrl } from './citation';

const paper = {
  concept_id: 'KSCA-2026-000001',
  version_no: 2,
  authors: '김민준',
  title: '청소년을 위한 강화학습 입문 실험',
  created_at: '2026-03-14T01:00:00.000Z',
};

describe('splitAuthors', () => {
  it('splits on commas, middle dots and "and"', () => {
    expect(splitAuthors('김민준, 정하은')).toEqual(['김민준', '정하은']);
    expect(splitAuthors('김민준·정하은 · 이서연')).toEqual(['김민준', '정하은', '이서연']);
    expect(splitAuthors('Kim and Lee')).toEqual(['Kim', 'Lee']);
    expect(splitAuthors('  ')).toEqual([]);
  });
});

describe('formatAPA', () => {
  it('formats author, year, title, version and identifier URL', () => {
    expect(formatAPA(paper)).toBe(
      '김민준 (2026). 청소년을 위한 강화학습 입문 실험 (Version 2) [Preprint]. KSCA. https://ksca.dev/papers/KSCA-2026-000001'
    );
  });
  it('joins multiple authors APA-style', () => {
    expect(formatAPA({ ...paper, authors: 'A, B, C' })).toMatch(/^A, B, & C \(2026\)/);
    expect(formatAPA({ ...paper, authors: 'A, B' })).toMatch(/^A, & B \(2026\)/);
  });
  it('uses the given base URL', () => {
    expect(formatAPA(paper, 'http://localhost:3000/')).toContain('http://localhost:3000/papers/KSCA-2026-000001');
  });
});

describe('formatBibTeX', () => {
  it('formats a @misc entry keyed by concept_id and version', () => {
    expect(formatBibTeX(paper)).toBe(
      [
        '@misc{KSCA-2026-000001v2,',
        '  author = {김민준},',
        '  title = {{청소년을 위한 강화학습 입문 실험}},',
        '  year = {2026},',
        '  version = {2},',
        '  publisher = {KSCA},',
        '  note = {KSCA-2026-000001},',
        '  url = {https://ksca.dev/papers/KSCA-2026-000001}',
        '}',
      ].join('\n')
    );
  });
  it('joins authors with "and" and escapes special characters', () => {
    const bib = formatBibTeX({ ...paper, authors: 'A, B', title: '50% faster C# & {more}' });
    expect(bib).toContain('author = {A and B}');
    expect(bib).toContain('title = {{50\\% faster C\\# \\& \\{more\\}}}');
  });
});

describe('paperUrl', () => {
  it('strips trailing slashes from the base', () => {
    expect(paperUrl('KSCA-2026-000001', 'https://x.org//')).toBe('https://x.org/papers/KSCA-2026-000001');
  });
});
