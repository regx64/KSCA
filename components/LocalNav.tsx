import Link from 'next/link';
import { cn } from '@/lib/utils';

const ctaClass = 'inline-flex h-7 shrink-0 items-center rounded-full bg-primary px-3 text-[12px] text-white transition hover:bg-[#0077ed]';

// Sticky secondary bar under the global nav, like apple.com product pages:
// section title on the left, quick links + one pill CTA on the right.
export function LocalNav({
  title,
  titleHref,
  links = [],
  cta,
}: {
  title: string;
  titleHref?: string;
  links?: { href: string; label: string; active?: boolean }[];
  // `plain`: render a normal <a> (e.g. API routes / file downloads).
  cta?: { href: string; label: string; plain?: boolean };
}) {
  return (
    <div className="sticky top-12 z-40 border-b border-black/[0.08] bg-[rgba(255,255,255,0.72)] backdrop-blur-xl backdrop-saturate-[1.8]">
      <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between gap-4 px-5 sm:px-6">
        {titleHref ? (
          <Link href={titleHref} className="shrink-0 text-[19px] font-semibold tracking-[-0.02em] sm:text-[21px]">
            {title}
          </Link>
        ) : (
          <span className="shrink-0 text-[19px] font-semibold tracking-[-0.02em] sm:text-[21px]">{title}</span>
        )}
        <div className="flex min-w-0 items-center gap-5">
          <ul className="no-scrollbar hidden min-w-0 items-center gap-5 overflow-x-auto sm:flex">
            {links.map((l) => (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={l.active ? 'page' : undefined}
                  className={cn('text-[12px] transition-colors hover:text-foreground', l.active ? 'text-foreground' : 'text-foreground/65')}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta &&
            (cta.plain ? (
              <a href={cta.href} className={ctaClass}>
                {cta.label}
              </a>
            ) : (
              <Link href={cta.href} className={ctaClass}>
                {cta.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
