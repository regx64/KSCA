import { describe, it, expect } from 'vitest';
import { yearOf, excerpt, formatDate } from './format';

describe('yearOf', () => {
  it('uses KST, not UTC, at the year boundary', () => {
    // 2025-12-31 16:00 UTC is already 2026-01-01 01:00 in Seoul
    expect(yearOf('2025-12-31T16:00:00.000Z')).toBe(2026);
  });
});

describe('formatDate', () => {
  it('formats in Korean', () => {
    expect(formatDate('2026-03-14T01:00:00.000Z')).toBe('2026년 3월 14일');
  });
});

describe('excerpt', () => {
  it('collapses whitespace and leaves short text alone', () => {
    expect(excerpt('a\n\n b')).toBe('a b');
  });
  it('truncates with an ellipsis', () => {
    expect(excerpt('가'.repeat(10), 5)).toBe('가가가가가…');
  });
});
