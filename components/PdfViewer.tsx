// Inline PDF viewer (README §3.3 "PDF 뷰어/다운로드"). The iframe loads the
// download route, which redirects to a short-lived signed URL (README §7).
export function PdfViewer({ paperId, title }: { paperId: string; title: string }) {
  const src = `/api/papers/${paperId}/download?inline=1`;
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/40">
      <iframe src={src} title={`${title} PDF`} className="h-[70vh] min-h-[420px] w-full bg-white" loading="lazy" />
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        미리보기가 보이지 않으면{' '}
        <a href={src} target="_blank" rel="noopener" className="underline underline-offset-4">
          새 탭에서 열기
        </a>
      </p>
    </div>
  );
}
