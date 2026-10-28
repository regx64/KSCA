export default function Loading() {
  return (
    <div role="status" aria-label="불러오는 중" className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded-lg bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
