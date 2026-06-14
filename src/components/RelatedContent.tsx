import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { contentRelations, RelatedLink } from '@/config/contentRelations';

function matchRoute(pathname: string): RelatedLink[] | null {
  // Exact match first
  if (contentRelations[pathname]) return contentRelations[pathname];
  // Pattern match: replace dynamic segments in keys with regex
  for (const pattern of Object.keys(contentRelations)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(pathname)) return contentRelations[pattern];
  }
  return null;
}

const kindConfig = {
  data: { label: 'DATA', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  glossary: { label: 'GLOSSARY', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  brief: { label: 'BRIEF', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
  lab: { label: 'LAB', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
};

export const RelatedContent: React.FC = () => {
  const { pathname } = useLocation();
  const links = matchRoute(pathname);
  if (!links || links.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-white/[0.05]">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
        Related Intelligence
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const cfg = kindConfig[link.kind];
          return (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors no-underline"
            >
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
