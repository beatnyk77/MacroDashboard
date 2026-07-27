import React from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { NotebookPayload } from '@/features/regime-digest/lib/types';

export interface BriefIndexProps {
  links: NotebookPayload['briefLinks'];
}

function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const BriefIndex: React.FC<BriefIndexProps> = ({ links }) => {
  if (!links.length) {
    return (
      <section aria-label="Related briefs">
        <Card variant="elevated" className="bg-slate-950/50 border-white/5">
          <CardContent className="p-5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 flex items-center gap-2 mb-3">
              <Newspaper size={14} aria-hidden />
              Related briefs
            </h2>
            <p className="text-sm text-muted-foreground/40">No linked briefs for this edition.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const ordered = [...links].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <section aria-label="Related briefs">
      <Card variant="elevated" className="bg-slate-950/50 border-white/5">
        <CardContent className="p-5 md:p-6 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 flex items-center gap-2">
            <Newspaper size={14} aria-hidden />
            Related briefs
          </h2>

          <ul className="divide-y divide-white/5">
            {ordered.map((link) => {
              const external = /^https?:\/\//i.test(link.url);
              return (
                <li key={`${link.date}-${link.url}`} className="py-3 first:pt-0 last:pb-0">
                  <a
                    href={link.url}
                    {...(external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="group flex items-start justify-between gap-3 hover:bg-white/[0.02] rounded-lg -mx-1 px-1 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-white/90 group-hover:text-blue-400 transition-colors truncate">
                        {link.title}
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-muted-foreground/45">
                        {formatDate(link.date)}
                      </p>
                    </div>
                    <ExternalLink
                      size={13}
                      className="mt-1 shrink-0 text-muted-foreground/30 group-hover:text-blue-400/70"
                      aria-hidden
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
};
