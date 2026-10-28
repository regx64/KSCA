// Maps Supabase/Postgres errors to messages users can act on, without
// leaking internals. Codes come from the DB constraints/triggers/RLS.
type DbError = { code?: string; message?: string } | null | undefined;

export function toUserMessage(error: DbError, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'): string {
  if (!error) return fallback;
  switch (error.code) {
    case '23505':
      return '이미 처리된 요청입니다.';
    case '42501':
      // Trigger-raised messages (migration 0006) are already user-facing Korean.
      return error.message && /[가-힣]/.test(error.message) ? error.message : '권한이 없습니다.';
    case '23514':
      return '입력값이 허용 범위를 벗어났습니다.';
    case '23503':
      return '대상을 찾을 수 없습니다.';
    case '22023':
      return '잘못된 요청입니다.';
    default:
      return fallback;
  }
}
