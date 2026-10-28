import { formatDateTime } from '@/lib/format';
import { VersionBadge } from '@/components/VersionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { ReportButton } from '@/components/ReportButton';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import type { ThreadComment } from '@/lib/comments';
import type { Role } from '@/lib/types';

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e8e8ed] to-[#d2d2d7] text-[14px] font-semibold text-ink-2">
      {name.slice(0, 1)}
    </span>
  );
}

export function CommentThread({
  comments,
  targetType,
  viewerId,
  viewerRole,
}: {
  comments: ThreadComment[];
  targetType: 'comment' | 'paper_comment';
  viewerId: string | null;
  viewerRole: Role | null;
}) {
  if (comments.length === 0) {
    return <p className="py-2 text-[15px] text-muted-foreground">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3.5 py-5 first:pt-0">
          <Avatar name={c.authorNickname} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[15px] font-semibold">{c.authorNickname}</span>
              {c.version !== undefined && <VersionBadge version={c.version} />}
              <StatusBadge status={c.status} />
              <time dateTime={c.createdAt} className="text-[12px] text-muted-foreground">
                {formatDateTime(c.createdAt)}
              </time>
              <span className="ml-auto flex items-center gap-1">
                {viewerRole === 'admin' && <AdminModerationButtons targetType={targetType} targetId={c.id} status={c.status} />}
                {c.authorId !== viewerId && <ReportButton targetType={targetType} targetId={c.id} loggedIn={viewerId !== null} />}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-[1.6] whitespace-pre-wrap break-words text-ink-2">{c.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
