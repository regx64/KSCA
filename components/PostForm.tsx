'use client';

import { useActionState, useState } from 'react';
import { createPost } from '@/lib/actions/board';
import { CATEGORY_LABELS } from '@/lib/board';
import { MAX_TAGS } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/SubmitButton';
import { FormMessage } from '@/components/FormMessage';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/utils';
import type { BoardCategory } from '@/lib/types';

export function PostForm({ categories, initialCategory }: { categories: BoardCategory[]; initialCategory: BoardCategory }) {
  const [state, formAction] = useActionState(createPost, {});
  const [content, setContent] = useState('');
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="category">카테고리</Label>
        <select
          id="category"
          name="category"
          defaultValue={initialCategory}
          required
          className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={200} className="h-9 bg-card" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">본문</Label>
          <div role="tablist" aria-label="본문 편집 모드" className="flex rounded-md border bg-card p-0.5 text-xs">
            {(['write', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn('rounded px-2.5 py-1', tab === t ? 'bg-secondary font-medium' : 'text-muted-foreground')}
              >
                {t === 'write' ? '작성' : '미리보기'}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          id="content"
          name="content"
          required
          rows={14}
          maxLength={20000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn('bg-card font-mono text-sm', tab === 'preview' && 'hidden')}
          placeholder="마크다운을 사용할 수 있어요. **굵게**, `코드`, - 목록 …"
        />
        {tab === 'preview' && (
          <div className="min-h-64 rounded-lg border bg-card p-4">
            {content.trim() ? <Markdown>{content}</Markdown> : <p className="text-sm text-muted-foreground">미리볼 내용이 없습니다.</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">마크다운 문법을 지원합니다.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">태그 (선택)</Label>
        <Input id="tags" name="tags" placeholder="알고리즘, 스터디" className="h-9 bg-card" />
        <p className="text-xs text-muted-foreground">쉼표로 구분, 최대 {MAX_TAGS}개</p>
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingLabel="게시 중…">
        게시하기
      </SubmitButton>
    </form>
  );
}
