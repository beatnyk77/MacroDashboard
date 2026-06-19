import React from 'react';
import { useLocation } from 'react-router-dom';
import { TrailLink } from '@/components/TrailLink';
import { contentRelations, RelatedLink } from '@/config/contentRelations';
import { getGlossaryRelations } from '@/config/glossaryRelations';
import { withoutTrailingSlash, withTrailingSlash } from '@/lib/urlPath';

const HOMEPAGE_LINK: RelatedLink = { to: '/', label: 'Live Terminal', kind: 'data' };

function ensureHomepage(links: RelatedLink[]): RelatedLink[] {
  if (links.some((l) => l.to === '/')) return links;
  return [HOMEPAGE_LINK, ...links];
}

function matchRoute(pathname: string): RelatedLink[] | null {
  const key = withoutTrailingSlash(pathname);

  const glossaryMatch = key.match(/^\/glossary\/([^/]+)$/);
  if (glossaryMatch) {
    return getGlossaryRelations(glossaryMatch[1]);
  }

  if (contentRelations[key]) return ensureHomepage(contentRelations[key]);

  // Pattern match: replace dynamic segments in keys with regex
  for (const pattern of Object.keys(contentRelations)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(key)) return ensureHomepage(contentRelations[pattern]);
  }
  return null;
}

const kindConfig = {
  data: { label: 'DATA', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  glossary: { label: 'GLOSSARY', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  brief: { label: 'BRIEF', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
  lab: { label: 'LAB', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
};

interface RelatedContentProps {
  /** 'inline' = compact chips; 'grid' = glassmorphic cards for homepage sections */
  variant?: 'inline' | 'grid';
  className?: string;
}

export const RelatedContent: React.FC<RelatedContentProps> = ({ variant = 'inline', className }) => {
  const { pathname } = useLocation();
  const links = matchRoute(pathname);
  if (!links || links.length === 0) return null;

  if (variant === 'grid') {
    return (
      <section className={className}>
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          Related Intelligence
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const cfg = kindConfig[link.kind];
            return (
              <TrailLink
                key={link.to}
                to={withTrailingSlash(link.to)}
                className="group flex flex-col rounded-xl border border-white/[0.08] bg-slate-900/40 p-3 no-underline backdrop-blur-xl transition-all hover:border-white/15 hover:bg-white/[0.04]"
              >
                <span className={`mb-2 w-fit text-[8px] font-black uppercase tracking-widest rounded border px-1.5 py-0.5 ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-xs font-semibold text-white/70 transition-colors group-hover:text-white">
                  {link.label}
                </span>
              </TrailLink>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={`mt-16 border-t border-white/[0.05] pt-8 ${className ?? ''}`}>
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        Related Intelligence
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const cfg = kindConfig[link.kind];
          return (
            <TrailLink
              key={link.to}
              to={withTrailingSlash(link.to)}
              className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 no-underline transition-colors hover:bg-white/[0.05]"
            >
              <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs font-semibold text-white/70 transition-colors group-hover:text-white">
                {link.label}
              </span>
            </TrailLink>
          );
        })}
      </div>
    </section>
  );
};
