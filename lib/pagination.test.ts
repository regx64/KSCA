import { describe, it, expect } from 'vitest';
import { parsePage, pageRange, totalPages } from './pagination';

describe('parsePage', () => {
  it('defaults to 1 for missing or invalid input', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-3')).toBe(1);
    expect(parsePage('2.5')).toBe(1);
    expect(parsePage('abc')).toBe(1);
  });
  it('parses valid pages', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['4', '5'])).toBe(4);
  });
});

describe('pageRange / totalPages', () => {
  it('computes inclusive ranges', () => {
    expect(pageRange(1, 10)).toEqual({ from: 0, to: 9 });
    expect(pageRange(3, 10)).toEqual({ from: 20, to: 29 });
  });
  it('rounds pages up and never returns 0', () => {
    expect(totalPages(0, 10)).toBe(1);
    expect(totalPages(21, 10)).toBe(3);
  });
});
