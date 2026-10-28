'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatAPA, formatBibTeX, type CitationInput } from '@/lib/citation';
import { cn } from '@/lib/utils';

// README §3.2: APA and BibTeX, auto-generated, one-click copy.
// Segmented control like Apple's product selectors.
export function CitationBlock({ paper, baseUrl }: { paper: CitationInput; baseUrl: string }) {
  const [kind, setKind] = useState<'apa' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);
  const formats = { apa: formatAPA(paper, baseUrl), bibtex: formatBibTeX(paper, baseUrl) };

  async function copy() {
    try {
      await navigator.clipboard.writeText(formats[kind]);
      setCopied(true);
      toast.success(`${kind === 'apa' ? 'APA' : 'BibTeX'} 인용을 복사했습니다.`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('복사하지 못했습니다. 직접 선택해서 복사해주세요.');
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="인용 형식" className="inline-flex rounded-full bg-surface p-1">
        {(['apa', 'bibtex'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              'rounded-full px-5 py-1.5 text-[14px] transition',
              kind === k ? 'bg-white font-semibold text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {k === 'apa' ? 'APA' : 'BibTeX'}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="relative mt-4 rounded-[18px] bg-surface p-6 pr-28">
        {kind === 'apa' ? (
          <p className="text-[15px] leading-[1.6] break-words">{formats.apa}</p>
        ) : (
          <pre className="overflow-x-auto font-mono text-[13px] leading-[1.6] whitespace-pre">{formats.bibtex}</pre>
        )}
        <button
          type="button"
          onClick={copy}
          className="absolute top-5 right-5 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] text-link shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
    </div>
  );
}
