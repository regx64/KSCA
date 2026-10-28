import { formatDateTime } from '@/lib/format';
import { VersionBadge } from '@/components/VersionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { ReportButton } from '@/components/ReportButton';
import { AdminModerationButtons } from '@/components/AdminModerationButtons';
import type { ThreadComment } from '@/lib/comments';
import type { Role } from '@/lib/types';

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
    return <p className="py-4 text-sm text-muted-foreground">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>;
  }
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {comments.map((c) => (
        <li key={c.id} className="px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{c.authorNickname}</span>
            {c.version !== undefined && <VersionBadge version={c.version} />}
            <StatusBadge status={c.status} />
            <time dateTime={c.createdAt} className="text-xs text-muted-foreground">
              {formatDateTime(c.createdAt)}
            </time>
            <span className="ml-auto flex items-center gap-1">
              {viewerRole === 'admin' && (
                <AdminModerationButtons targetType={targetType} targetId={c.id} status={c.status} />
              )}
              {c.authorId !== viewerId && (
                <ReportButton targetType={targetType} targetId={c.id} loggedIn={viewerId !== null} />
              )}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-6 whitespace-pre-wrap break-words">{c.content}</p>
        </li>
      ))}
    </ul>
  );
}
