'use client';

import { useActionState, useState } from 'react';
import { createPost } from '@/lib/actions/board';
import { CATEGORY_LABELS } from '@/lib/board';
import { MAX_TAGS } from '@/lib/validation';
import { SubmitButton } from '@/components/SubmitButton';
import { FormMessage } from '@/components/FormMessage';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/utils';
import type { BoardCategory } from '@/lib/types';

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e6e73' stroke-width='2.5'><path d='m6 9 6 6 6-6'/></svg>\")";

export function PostForm({ categories, initialCategory }: { categories: BoardCategory[]; initialCategory: BoardCategory }) {
  const [state, formAction] = useActionState(createPost, {});
  const [content, setContent] = useState('');
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="category" className="field-label">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initialCategory}
          required
          className="field appearance-none pr-10"
          style={{ backgroundImage: SELECT_CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="title" className="field-label">
          제목
        </label>
        <input id="title" name="title" required maxLength={200} className="field" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="content" className="field-label mb-0">
            본문
          </label>
          <div role="tablist" aria-label="본문 편집 모드" className="inline-flex rounded-full bg-surface p-0.5 text-[13px]">
            {(['write', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-full px-3.5 py-1 transition',
                  tab === t ? 'bg-white font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'text-muted-foreground'
                )}
              >
                {t === 'write' ? '작성' : '미리보기'}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="content"
          name="content"
          required
          rows={14}
          maxLength={20000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn('field font-mono text-[15px]', tab === 'preview' && 'hidden')}
          placeholder="마크다운을 사용할 수 있어요. **굵게**, `코드`, - 목록 …"
        />
        {tab === 'preview' && (
          <div className="min-h-72 rounded-xl border border-hairline bg-white p-5">
            {content.trim() ? <Markdown>{content}</Markdown> : <p className="text-[15px] text-muted-foreground">미리볼 내용이 없습니다.</p>}
          </div>
        )}
        <p className="field-hint">마크다운 문법을 지원합니다.</p>
      </div>
      <div>
        <label htmlFor="tags" className="field-label">
          태그 <span className="font-normal text-muted-foreground">(선택)</span>
        </label>
        <input id="tags" name="tags" placeholder="알고리즘, 스터디" className="field" />
        <p className="field-hint">쉼표로 구분, 최대 {MAX_TAGS}개</p>
      </div>
      <FormMessage state={state} />
      <div className="border-t border-border pt-8">
        <SubmitButton size="lg" pendingLabel="게시 중…" className="w-full sm:w-auto">
          게시하기
        </SubmitButton>
      </div>
    </form>
  );
}
