'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { resolveReport } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import type { ContentStatus, TargetType } from '@/lib/types';

// Admin actions on a piece of content. In the review queue these are
// README §11's "삭제 확정" / "복구"; on content pages they are the direct
// "콘텐츠 강제 삭제/복구" from README §2. Both close pending reports.
export function AdminModerationButtons({
  targetType,
  targetId,
  status,
  mode = 'inline',
}: {
  targetType: TargetType;
  targetId: string;
  status: ContentStatus;
  mode?: 'inline' | 'queue';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(decision: 'confirm' | 'restore') {
    if (decision === 'confirm' && !confirm('이 콘텐츠를 비공개로 확정할까요?')) return;
    startTransition(async () => {
      const res = await resolveReport(targetType, targetId, decision);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message ?? '처리했습니다.');
        router.refresh();
      }
    });
  }

  if (mode === 'queue') {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={pending} onClick={() => run('confirm')}>
          삭제 확정
        </Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run('restore')}>
          복구
        </Button>
      </div>
    );
  }

  return status === 'public' ? (
    <Button variant="ghost" size="xs" className="text-destructive" disabled={pending} onClick={() => run('confirm')}>
      운영진: 숨기기
    </Button>
  ) : (
    <Button variant="ghost" size="xs" className="text-primary" disabled={pending} onClick={() => run('restore')}>
      운영진: 공개 복구
    </Button>
  );
}
