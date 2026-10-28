'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { submitReport } from '@/lib/actions/reports';
import { REPORT_REASONS, type ReportReason } from '@/lib/validation';
import { loginHref } from '@/lib/paths';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TargetType } from '@/lib/types';

// README §3.5 신고 버튼. Reused for papers, posts, and both comment kinds.
export function ReportButton({
  targetType,
  targetId,
  loggedIn,
  label = '신고',
}: {
  targetType: TargetType;
  targetId: string;
  loggedIn: boolean;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const trigger = buttonVariants({ variant: 'ghost', size: 'xs', className: 'text-muted-foreground hover:text-foreground' });

  if (!loggedIn) {
    return (
      <Link href={loginHref(pathname)} className={trigger}>
        <Flag aria-hidden />
        {label}
      </Link>
    );
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await submitReport({ targetType, targetId, reason, detail });
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setDetail('');
      toast.success(res.message ?? '신고가 접수되었습니다.');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className={trigger} />}>
        <Flag aria-hidden />
        {label}
      </DialogTrigger>
      <DialogContent className="gap-5 rounded-[24px] p-7 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[21px] font-bold tracking-[-0.02em]">신고하기</DialogTitle>
          <DialogDescription>
            신고가 3건 누적되면 자동으로 비공개 처리되고, 운영진이 검토합니다.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">신고 사유</legend>
          {(Object.entries(REPORT_REASONS) as [ReportReason, string][]).map(([value, text]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-hairline px-4 py-3 text-[15px] transition has-checked:border-primary has-checked:bg-[#e8f1fc]">
              <input
                type="radio"
                name="reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="accent-primary"
              />
              {text}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor={`report-detail-${targetId}`}>상세 내용 {reason === 'other' ? '(필수)' : '(선택)'}</Label>
          <textarea
            id={`report-detail-${targetId}`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="운영진이 판단하는 데 도움이 되는 내용을 적어주세요."
            className="field text-[15px]"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
          <Button variant="destructive" onClick={onSubmit} disabled={pending} className="w-full sm:w-auto">
            {pending ? '제출 중…' : '신고 제출'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
