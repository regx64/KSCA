'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatAPA, formatBibTeX, type CitationInput } from '@/lib/citation';

// README §3.2: APA and BibTeX, auto-generated, one-click copy.
export function CitationBlock({ paper, baseUrl }: { paper: CitationInput; baseUrl: string }) {
  const [copied, setCopied] = useState<'apa' | 'bibtex' | null>(null);
  const formats = { apa: formatAPA(paper, baseUrl), bibtex: formatBibTeX(paper, baseUrl) };

  async function copy(kind: 'apa' | 'bibtex') {
    try {
      await navigator.clipboard.writeText(formats[kind]);
      setCopied(kind);
      toast.success(`${kind === 'apa' ? 'APA' : 'BibTeX'} 인용을 복사했습니다.`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('복사하지 못했습니다. 직접 선택해서 복사해주세요.');
    }
  }

  return (
    <Tabs defaultValue="apa" className="gap-3">
      <TabsList>
        <TabsTrigger value="apa">APA</TabsTrigger>
        <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
      </TabsList>
      {(['apa', 'bibtex'] as const).map((kind) => (
        <TabsContent key={kind} value={kind}>
          <div className="relative rounded-lg border bg-muted/50 p-4 pr-24">
            {kind === 'apa' ? (
              <p className="text-sm leading-6 break-words">{formats.apa}</p>
            ) : (
              <pre className="overflow-x-auto font-mono text-xs leading-5 whitespace-pre">{formats.bibtex}</pre>
            )}
            <Button size="sm" variant="outline" className="absolute top-3 right-3" onClick={() => copy(kind)}>
              {copied === kind ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied === kind ? '복사됨' : '복사'}
            </Button>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
