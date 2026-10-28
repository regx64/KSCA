import { DEFAULT_BASE_URL } from '@/lib/citation';

// Public base URL used for citation links and auth email redirects.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return DEFAULT_BASE_URL;
}
