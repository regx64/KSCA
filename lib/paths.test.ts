import { describe, it, expect } from 'vitest';
import { safeNextPath, loginHref } from './paths';

describe('safeNextPath', () => {
  it('allows same-site paths', () => {
    expect(safeNextPath('/papers/KSCA-2026-000001')).toBe('/papers/KSCA-2026-000001');
    expect(safeNextPath('/board?x=1')).toBe('/board?x=1');
  });
  it('rejects external and protocol-relative targets', () => {
    expect(safeNextPath('https://evil.example')).toBe('/me');
    expect(safeNextPath('//evil.example')).toBe('/me');
    expect(safeNextPath('/\\evil.example')).toBe('/me');
    expect(safeNextPath('/x\nSet-Cookie: a')).toBe('/me');
  });
  it('falls back when missing', () => {
    expect(safeNextPath(null, '/')).toBe('/');
  });
});

describe('loginHref', () => {
  it('encodes the return path', () => {
    expect(loginHref('/papers/upload')).toBe('/login?next=%2Fpapers%2Fupload');
  });
});
