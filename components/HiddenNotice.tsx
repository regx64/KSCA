import { EyeOff } from 'lucide-react';

export function HiddenNotice({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div role="note" className="flex items-center justify-center gap-2 bg-[#fde8e8] px-5 py-3 text-center text-[14px] text-[#86000a]">
      <EyeOff className="size-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">비공개 처리된 콘텐츠입니다.</strong> 신고 누적 또는 운영진 조치로 비공개되어{' '}
        {isAdmin ? '운영진' : '작성자'}에게만 보입니다.
      </span>
    </div>
  );
}
