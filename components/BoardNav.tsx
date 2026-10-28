import { LocalNav } from '@/components/LocalNav';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/board';
import type { BoardCategory } from '@/lib/types';

export function BoardNav({ active }: { active?: BoardCategory }) {
  return (
    <LocalNav
      title="커뮤니티"
      titleHref="/board"
      links={CATEGORIES.map((c) => ({ href: `/board/${c}`, label: CATEGORY_LABELS[c], active: c === active }))}
      cta={{ href: active ? `/board/write?category=${active}` : '/board/write', label: '글쓰기' }}
    />
  );
}
