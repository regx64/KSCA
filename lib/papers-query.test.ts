import { describe, it, expect } from 'vitest';
import { parsePaperListParams, paperListHref, escapeLike } from './papers-query';

describe('parsePaperListParams', () => {
  it('defaults to latest sort, no filters, page 1', () => {
    expect(parsePaperListParams({})).toEqual({ sort: 'latest', tag: null, q: null, page: 1 });
  });
  it('accepts sort=views', () => {
    expect(parsePaperListParams({ sort: 'views' }).sort).toBe('views');
  });
  it('falls back to latest for an unknown sort value', () => {
    expect(parsePaperListParams({ sort: 'bogus' }).sort).toBe('latest');
  });
  it('passes through tag, query and page', () => {
    expect(parsePaperListParams({ tag: 'AI', q: ' 강화학습 ', page: '2' })).toEqual({
      sort: 'latest',
      tag: 'AI',
      q: '강화학습',
      page: 2,
    });
  });
  it('treats blank tag/q as null', () => {
    expect(parsePaperListParams({ tag: ' ', q: '' })).toMatchObject({ tag: null, q: null });
  });
});

describe('paperListHref', () => {
  it('omits defaults', () => {
    expect(paperListHref({ sort: 'latest', page: 1 })).toBe('/papers');
  });
  it('encodes params', () => {
    expect(paperListHref({ tag: '데이터 분석', sort: 'views', page: 2 })).toBe(
      '/papers?tag=%EB%8D%B0%EC%9D%B4%ED%84%B0+%EB%B6%84%EC%84%9D&sort=views&page=2'
    );
  });
});

describe('escapeLike', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });
});

import { ilikeAnyFilter } from './papers-query';

describe('ilikeAnyFilter', () => {
  it('builds a quoted or() filter across columns', () => {
    expect(ilikeAnyFilter(['title', 'authors'], '강화학습')).toBe('title.ilike."%강화학습%",authors.ilike."%강화학습%"');
  });
  it('neutralizes commas, quotes, parentheses and wildcards', () => {
    expect(ilikeAnyFilter(['title'], 'a,b)"c%')).toBe('title.ilike."%a,b)\\"c\\\\%%"');
  });
});
