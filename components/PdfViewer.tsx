// Inline PDF viewer (README §3.3). The iframe loads the download route,
// which redirects to a short-lived signed URL (README §7).
export function PdfViewer({ paperId, title }: { paperId: string; title: string }) {
  const src = `/api/papers/${paperId}/download?inline=1`;
  return (
    <div className="overflow-hidden rounded-[22px] bg-surface shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
      <iframe src={src} title={`${title} PDF`} className="h-[75vh] min-h-[440px] w-full bg-white" loading="lazy" />
      <p className="px-5 py-3 text-[12px] text-muted-foreground">
        미리보기가 보이지 않나요?{' '}
        <a href={src} target="_blank" rel="noopener" className="text-link hover:underline">
          새 탭에서 열기
        </a>
      </p>
    </div>
  );
}
