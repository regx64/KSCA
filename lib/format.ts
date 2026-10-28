// Dates are rendered in KST regardless of the server's timezone (Vercel runs
// in UTC), so server-rendered output matches what Korean users expect.
const TZ = 'Asia/Seoul';

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(iso)
  );
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function yearOf(iso: string): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(new Date(iso)));
}

export function excerpt(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max).trimEnd()}…`;
}
