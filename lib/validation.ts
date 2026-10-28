// Pure input validation shared by Server Actions and forms. The DB enforces
// the same bounds (migration 0006 §9); these give users readable errors first.
import type { TargetType } from '@/lib/types';

export type Check = { ok: true } | { ok: false; error: string };
const ok: Check = { ok: true };
const fail = (error: string): Check => ({ ok: false, error });

// README §3.1: PDF only, 20MB max.
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function validateUpload(input: { fileName: string; fileSize: number; fileType: string }): Check {
  const isPdfName = input.fileName.toLowerCase().endsWith('.pdf');
  const isPdfType = input.fileType === 'application/pdf' || input.fileType === '';
  if (!isPdfName || !isPdfType) return fail('PDF 파일만 업로드할 수 있습니다.');
  if (input.fileSize <= 0) return fail('빈 파일은 업로드할 수 없습니다.');
  if (input.fileSize > MAX_PDF_BYTES) return fail('파일 크기는 20MB를 초과할 수 없습니다.');
  return ok;
}

export const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

// "AI, #데이터분석 , ai" → ['AI', '데이터분석'] (trimmed, '#'-stripped, de-duplicated case-insensitively)
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const tag = part.trim().replace(/^#+/, '').trim().slice(0, MAX_TAG_LENGTH);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

export function optionalText(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? '').trim();
  return s === '' ? null : s;
}

export type PaperFields = { title: string; authors: string; abstract: string; tags: string[]; school: string | null };

export function validatePaperFields(f: PaperFields): Check {
  if (!f.title.trim()) return fail('제목을 입력해주세요.');
  if (f.title.trim().length > 300) return fail('제목은 300자 이내로 입력해주세요.');
  if (!f.authors.trim()) return fail('저자명을 입력해주세요.');
  if (f.authors.length > 500) return fail('저자명은 500자 이내로 입력해주세요.');
  if (!f.abstract.trim()) return fail('초록을 입력해주세요.');
  if (f.abstract.trim().length > 5000) return fail('초록은 5000자 이내로 입력해주세요.');
  if (f.tags.length > MAX_TAGS) return fail(`태그는 최대 ${MAX_TAGS}개까지 입력할 수 있습니다.`);
  if (f.school && f.school.length > 100) return fail('학교명은 100자 이내로 입력해주세요.');
  return ok;
}

export function validatePostFields(f: { title: string; content: string; tags: string[] }): Check {
  if (!f.title.trim()) return fail('제목을 입력해주세요.');
  if (f.title.trim().length > 200) return fail('제목은 200자 이내로 입력해주세요.');
  if (!f.content.trim()) return fail('본문을 입력해주세요.');
  if (f.content.trim().length > 20000) return fail('본문은 20000자 이내로 입력해주세요.');
  if (f.tags.length > MAX_TAGS) return fail(`태그는 최대 ${MAX_TAGS}개까지 입력할 수 있습니다.`);
  return ok;
}

export const MAX_COMMENT_LENGTH = 2000;

export function validateCommentContent(content: string): Check {
  const trimmed = content.trim();
  if (trimmed.length === 0) return fail('댓글 내용을 입력해주세요.');
  if (trimmed.length > MAX_COMMENT_LENGTH) return fail(`댓글은 ${MAX_COMMENT_LENGTH}자를 넘을 수 없습니다.`);
  return ok;
}

export type SignupFields = { email: string; password: string; nickname: string; school: string | null };

export function parseSignupForm(formData: FormData): SignupFields {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    nickname: String(formData.get('nickname') ?? '').trim(),
    school: optionalText(formData.get('school')),
  };
}

export function validateProfileFields(f: { nickname: string; school: string | null }): Check {
  if (!f.nickname) return fail('닉네임을 입력해주세요.');
  if (f.nickname.length > 30) return fail('닉네임은 30자 이내로 입력해주세요.');
  if (f.school && f.school.length > 100) return fail('학교명은 100자 이내로 입력해주세요.');
  return ok;
}

export function validateSignup(f: SignupFields): Check {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return fail('올바른 이메일 주소를 입력해주세요.');
  if (f.password.length < 8) return fail('비밀번호는 8자 이상이어야 합니다.');
  return validateProfileFields(f);
}

// README §3.5: 표절 의심 / 부적절한 내용 / 스팸 / 기타(자유 텍스트)
export const REPORT_REASONS = {
  plagiarism: '표절 의심',
  inappropriate: '부적절한 내용',
  spam: '스팸',
  other: '기타',
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export function isValidReportReason(reason: string): reason is ReportReason {
  return Object.prototype.hasOwnProperty.call(REPORT_REASONS, reason);
}

export function validateReport(input: { reason: string; detail: string | null }): Check {
  if (!isValidReportReason(input.reason)) return fail('유효하지 않은 신고 사유입니다.');
  if (input.reason === 'other' && !input.detail) return fail('기타 사유를 입력해주세요.');
  if (input.detail && input.detail.length > 1000) return fail('상세 내용은 1000자 이내로 입력해주세요.');
  return ok;
}

export const TARGET_TYPES: readonly TargetType[] = ['paper', 'post', 'comment', 'paper_comment'];

export function isValidTargetType(x: string): x is TargetType {
  return (TARGET_TYPES as readonly string[]).includes(x);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(x: string): boolean {
  return UUID_RE.test(x);
}

export const CONCEPT_ID_RE = /^KSCA-\d{4}-\d{6}$/;
