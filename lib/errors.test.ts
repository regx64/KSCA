import { describe, it, expect } from 'vitest';
import { toUserMessage } from './errors';

describe('toUserMessage', () => {
  it('maps unique violations', () => {
    expect(toUserMessage({ code: '23505', message: 'duplicate key' })).toBe('이미 처리된 요청입니다.');
  });
  it('passes through Korean trigger messages for permission errors', () => {
    expect(toUserMessage({ code: '42501', message: '원저자만 새 버전을 업로드할 수 있습니다.' })).toBe(
      '원저자만 새 버전을 업로드할 수 있습니다.'
    );
  });
  it('hides raw English RLS messages', () => {
    expect(toUserMessage({ code: '42501', message: 'new row violates row-level security policy' })).toBe('권한이 없습니다.');
  });
  it('falls back for unknown errors', () => {
    expect(toUserMessage({ code: 'XX000' }, 'fb')).toBe('fb');
    expect(toUserMessage(null, 'fb')).toBe('fb');
  });
});
