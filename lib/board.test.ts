import { describe, it, expect } from 'vitest';
import { isValidCategory, canPostToCategory, writableCategories } from './board';

describe('isValidCategory', () => {
  it('accepts the four defined categories', () => {
    for (const c of ['free', 'question', 'study', 'notice']) expect(isValidCategory(c)).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isValidCategory('bogus')).toBe(false);
  });
});

describe('canPostToCategory', () => {
  it('allows any role to post in free/question/study', () => {
    expect(canPostToCategory('free', null)).toBe(true);
    expect(canPostToCategory('question', 'user')).toBe(true);
    expect(canPostToCategory('study', 'user')).toBe(true);
  });
  it('only allows admins to post in notice', () => {
    expect(canPostToCategory('notice', 'user')).toBe(false);
    expect(canPostToCategory('notice', null)).toBe(false);
    expect(canPostToCategory('notice', 'admin')).toBe(true);
  });
});

describe('writableCategories', () => {
  it('hides notice from non-admins', () => {
    expect(writableCategories('user')).not.toContain('notice');
    expect(writableCategories('admin')).toContain('notice');
  });
});
