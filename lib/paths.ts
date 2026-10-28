// Validates a post-login `next` redirect target: same-site absolute paths
// only, so ?next=https://evil.example or //evil.example can't be abused.
export function safeNextPath(next: string | null | undefined, fallback = '/me'): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}

export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
