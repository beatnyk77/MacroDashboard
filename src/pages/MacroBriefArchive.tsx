import React from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { useMacroBriefArchive } from '@/hooks/useMacroBrief';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

function briefPath(briefDate: string): string {
  const d = isValid(parseISO(briefDate)) ? parseISO(briefDate) : new Date();
  return `/macro-brief/${format(d, 'yyyy/MM/dd')}`;
}

function regimeColor(label: string | null): string {
  if (!label) return 'text-white/40';
  const l = label.toLowerCase();
  if (l.includes('expansion') || l.includes('recovery')) return 'text-emerald-400';
  if (l.includes('tight') || l.includes('slow')) return 'text-rose-400';
  return 'text-blue-400';
}

export const MacroBriefArchive: React.FC = () => {
  const { data: briefs, isLoading } = useMacroBriefArchive();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <SEOManager
        title="Morning Macro Brief Archive"
        description="Daily institutional macro intelligence briefs — what changed overnight, regime status, and focus area observations."
        canonicalUrl="https://graphiquestor.com/macro-brief/archive"
      />

      <div className="mb-10 space-y-2">
        <nav className="text-[10px] font-black uppercase tracking-widest text-white/25 flex items-center gap-2">
          <Link to="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/macro-brief" className="hover:text-white/50 transition-colors">Brief</Link>
          <span>/</span>
          <span className="text-white/50">Archive</span>
        </nav>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Morning Brief Archive
        </h1>
        <p className="text-sm font-medium text-white/40 max-w-lg">
          Daily pre-market macro intelligence. Each brief is a permanent indexed page.
        </p>
      </div>

      <Card className="overflow-hidden bg-slate-950/50 border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : !briefs || briefs.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-white/30 uppercase tracking-widest">
              No briefs published yet.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {briefs.map((brief) => {
                const parsedDate = isValid(parseISO(brief.brief_date))
                  ? parseISO(brief.brief_date)
                  : new Date();
                const isLatest = brief.brief_date === today;

                return (
                  <li key={brief.id} className="group">
                    <Link
                      to={briefPath(brief.brief_date)}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/50">
                          <Calendar size={12} className="text-white/25" />
                          {format(parsedDate, 'EEE, MMM d yyyy')}
                        </div>

                        {isLatest && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-wider">
                            Latest
                          </span>
                        )}

                        {brief.regime_label && (
                          <span className={`hidden sm:block text-xs font-black uppercase ${regimeColor(brief.regime_label)}`}>
                            {brief.regime_label}
                            {brief.regime_score !== null && (
                              <span className="ml-1.5 font-mono text-white/25">{brief.regime_score}</span>
                            )}
                          </span>
                        )}
                      </div>

                      <ChevronRight size={16} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
