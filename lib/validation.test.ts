import { describe, it, expect } from 'vitest';
import {
  validateUpload,
  parseTags,
  validatePaperFields,
  validatePostFields,
  validateCommentContent,
  parseSignupForm,
  validateSignup,
  isValidReportReason,
  validateReport,
  isValidTargetType,
  isUuid,
  MAX_PDF_BYTES,
} from './validation';

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe('validateUpload', () => {
  it('accepts a PDF under 20MB', () => {
    expect(validateUpload({ fileName: 'x.pdf', fileSize: 10 * 1024 * 1024, fileType: 'application/pdf' })).toEqual({ ok: true });
  });
  it('accepts exactly 20MB', () => {
    expect(validateUpload({ fileName: 'X.PDF', fileSize: MAX_PDF_BYTES, fileType: 'application/pdf' }).ok).toBe(true);
  });
  it('rejects non-PDF types and names', () => {
    expect(validateUpload({ fileName: 'x.docx', fileSize: 1000, fileType: 'application/msword' }).ok).toBe(false);
    expect(validateUpload({ fileName: 'x.pdf', fileSize: 1000, fileType: 'image/png' }).ok).toBe(false);
    expect(validateUpload({ fileName: 'x.exe', fileSize: 1000, fileType: 'application/pdf' }).ok).toBe(false);
  });
  it('rejects files over 20MB and empty files', () => {
    expect(validateUpload({ fileName: 'x.pdf', fileSize: MAX_PDF_BYTES + 1, fileType: 'application/pdf' }).ok).toBe(false);
    expect(validateUpload({ fileName: 'x.pdf', fileSize: 0, fileType: 'application/pdf' }).ok).toBe(false);
  });
});

describe('parseTags', () => {
  it('trims, strips #, drops empties and de-duplicates case-insensitively', () => {
    expect(parseTags(' AI, #데이터분석 , ,ai,  ')).toEqual(['AI', '데이터분석']);
  });
  it('returns [] for blank input', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('validatePaperFields', () => {
  const base = { title: 't', authors: 'a', abstract: 'b', tags: [], school: null };
  it('accepts valid fields', () => expect(validatePaperFields(base)).toEqual({ ok: true }));
  it('requires title, authors, abstract', () => {
    expect(validatePaperFields({ ...base, title: ' ' }).ok).toBe(false);
    expect(validatePaperFields({ ...base, authors: '' }).ok).toBe(false);
    expect(validatePaperFields({ ...base, abstract: '' }).ok).toBe(false);
  });
  it('limits tags to 10', () => {
    expect(validatePaperFields({ ...base, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).ok).toBe(false);
  });
});

describe('validatePostFields', () => {
  it('requires title and content', () => {
    expect(validatePostFields({ title: '', content: 'c', tags: [] }).ok).toBe(false);
    expect(validatePostFields({ title: 't', content: '  ', tags: [] }).ok).toBe(false);
    expect(validatePostFields({ title: 't', content: 'c', tags: [] }).ok).toBe(true);
  });
});

describe('validateCommentContent', () => {
  it('rejects empty content', () => expect(validateCommentContent('   ').ok).toBe(false));
  it('rejects content over 2000 characters', () => expect(validateCommentContent('a'.repeat(2001)).ok).toBe(false));
  it('accepts normal content', () => expect(validateCommentContent('좋은 논문이네요!')).toEqual({ ok: true }));
});

describe('parseSignupForm / validateSignup', () => {
  it('extracts email, password, nickname, and optional school', () => {
    expect(parseSignupForm(fd({ email: ' a@b.com ', password: 'secret123', nickname: '민준', school: '한빛고' }))).toEqual({
      email: 'a@b.com',
      password: 'secret123',
      nickname: '민준',
      school: '한빛고',
    });
  });
  it('treats a blank school as null', () => {
    expect(parseSignupForm(fd({ email: 'a@b.com', password: 'x', nickname: 'n', school: '  ' })).school).toBeNull();
  });
  it('validates email, password length and nickname', () => {
    const good = { email: 'a@b.com', password: 'secret123', nickname: 'n', school: null };
    expect(validateSignup(good).ok).toBe(true);
    expect(validateSignup({ ...good, email: 'nope' }).ok).toBe(false);
    expect(validateSignup({ ...good, password: 'short' }).ok).toBe(false);
    expect(validateSignup({ ...good, nickname: '' }).ok).toBe(false);
    expect(validateSignup({ ...good, nickname: 'x'.repeat(31) }).ok).toBe(false);
  });
});

describe('reports', () => {
  it('accepts the four defined reasons only', () => {
    for (const r of ['plagiarism', 'inappropriate', 'spam', 'other']) expect(isValidReportReason(r)).toBe(true);
    expect(isValidReportReason('bogus')).toBe(false);
    expect(isValidReportReason('toString')).toBe(false);
  });
  it('requires a detail for "other"', () => {
    expect(validateReport({ reason: 'other', detail: null }).ok).toBe(false);
    expect(validateReport({ reason: 'other', detail: '사유' }).ok).toBe(true);
    expect(validateReport({ reason: 'spam', detail: null }).ok).toBe(true);
  });
  it('validates target types', () => {
    expect(isValidTargetType('paper_comment')).toBe(true);
    expect(isValidTargetType('profile')).toBe(false);
  });
});

describe('isUuid', () => {
  it('matches canonical UUIDs only', () => {
    expect(isUuid('a0000000-0000-0000-0000-000000000001')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
