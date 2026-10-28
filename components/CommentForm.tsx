'use client';

import { useActionState, useEffect, useRef } from 'react';
import { SubmitButton } from '@/components/SubmitButton';
import { FormMessage } from '@/components/FormMessage';
import { MAX_COMMENT_LENGTH } from '@/lib/validation';
import type { ActionState } from '@/lib/types';

export function CommentForm({
  action,
  hint,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  hint?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <label htmlFor="comment-content" className="sr-only">
        댓글 내용
      </label>
      <textarea
        id="comment-content"
        name="content"
        required
        rows={3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder="댓글을 남겨주세요. 서로 존중하는 대화를 부탁드려요."
        className="field resize-y"
      />
      <FormMessage state={{ error: state.error }} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">{hint}</p>
        <SubmitButton size="sm" pendingLabel="등록 중…">
          댓글 작성
        </SubmitButton>
      </div>
    </form>
  );
}
