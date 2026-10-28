import { EyeOff } from 'lucide-react';

// Shown to the author/admin when they view content that is hidden
// (auto-hidden at 3 reports, or hidden by an admin).
export function HiddenNotice({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div role="note" className="mb-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <EyeOff className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <div>
        <p className="font-medium text-destructive">비공개 처리된 콘텐츠입니다</p>
        <p className="mt-0.5 text-muted-foreground">
          신고 누적 또는 운영진 조치로 비공개되었습니다. {isAdmin ? '운영진' : '작성자'}에게만 보입니다.
          {!isAdmin && ' 운영진 검토 후 복구되거나 비공개가 확정됩니다.'}
        </p>
      </div>
    </div>
  );
}
