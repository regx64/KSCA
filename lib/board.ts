import type { BoardCategory, Role } from '@/lib/types';

// README §4: 자유 / 질문 / 스터디·프로젝트 모집 / 공지(운영진 전용 작성)
export const CATEGORY_LABELS: Record<BoardCategory, string> = {
  notice: '공지',
  free: '자유',
  question: '질문',
  study: '스터디·프로젝트 모집',
};

export const CATEGORY_DESCRIPTIONS: Record<BoardCategory, string> = {
  notice: '운영진이 전하는 학회 소식과 안내',
  free: '연구 이야기부터 일상까지 자유롭게',
  question: '막히는 코드, 궁금한 개념을 함께 해결해요',
  study: '함께 공부하고 프로젝트를 만들 사람을 찾아요',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as BoardCategory[];

export function isValidCategory(x: string): x is BoardCategory {
  return (CATEGORIES as string[]).includes(x);
}

// README §12 posts_insert: only admins may post in 'notice'.
export function canPostToCategory(category: BoardCategory, role: Role | null): boolean {
  if (category !== 'notice') return true;
  return role === 'admin';
}

export function writableCategories(role: Role | null): BoardCategory[] {
  return CATEGORIES.filter((c) => canPostToCategory(c, role));
}
