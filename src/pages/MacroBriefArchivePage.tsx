import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { useMacroBriefArchive } from '@/hooks/useMacroBrief';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getRegimeColors } from '@/constants/semanticColors';
import { format, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MacroBriefArchivePage: React.FC = () => {
  const [page, setPage] = useState(0);
  const { data: briefs, isLoading, error } = useMacroBriefArchive(page);

  // Determine if next page has data (if we returned a full list of 30, assume there is a next page)
  const hasNextPage = briefs && briefs.length === 30;
  const hasPrevPage = page > 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <SEOManager
        title="Morning Macro Brief Archive | GraphiQuestor"
        description="Chronological archive of GraphiQuestor daily Morning Macro Briefs tracking regime changes, risk telemetry, and focus signals."
        canonicalUrl="https://graphiquestor.com/macro-brief/archive"
        robots="index, follow"
      />

      {/* Breadcrumbs & Header */}
      <div className="mb-10 space-y-2">
        <nav className="text-[10px] font-mono uppercase tracking-widest text-white/25 flex items-center gap-2">
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
          Daily pre-market macro intelligence history. Each brief is a permanent indexed page.
        </p>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden bg-slate-950/50 border border-white/10 rounded-2xl shadow-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-sm font-bold text-rose-400 uppercase tracking-widest">
              Error loading archive data.
            </div>
          ) : !briefs || briefs.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-white/30 uppercase tracking-widest">
              No briefs published yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-mono text-xs text-white/70">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01]">
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-white/40 text-[10px]">
                      Date
                    </th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-white/40 text-[10px]">
                      Regime
                    </th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-white/40 text-[10px] text-center">
                      Score
                    </th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-white/40 text-[10px] text-right">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {briefs.map((brief) => {
                    const parsedDate = isValid(parseISO(brief.brief_date))
                      ? parseISO(brief.brief_date)
                      : new Date();
                    const formattedDate = format(parsedDate, 'EEE, MMM d, yyyy');
                    const regimeColors = getRegimeColors(brief.regime_label || 'unknown');

                    return (
                      <tr key={brief.brief_date} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-semibold text-white/95">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-white/20" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {brief.regime_label ? (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                              regimeColors.bg,
                              regimeColors.text
                            )}>
                              {brief.regime_label}
                            </span>
                          ) : (
                            <span className="text-white/20">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white/80">
                          {brief.regime_score !== null ? brief.regime_score : '--'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/macro-brief/${brief.brief_date}`}
                            className="inline-flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 font-black uppercase tracking-wider hover:underline transition-colors"
                          >
                            <span>View</span>
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={!hasPrevPage}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/12 text-xs font-mono text-white/60 hover:bg-white/10 hover:text-white transition-all",
            !hasPrevPage && "opacity-30 cursor-not-allowed select-none"
          )}
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Page {page + 1}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNextPage}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/12 text-xs font-mono text-white/60 hover:bg-white/10 hover:text-white transition-all",
            !hasNextPage && "opacity-30 cursor-not-allowed select-none"
          )}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
