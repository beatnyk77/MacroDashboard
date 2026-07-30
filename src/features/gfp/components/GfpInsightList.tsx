import React from 'react';
import { useGfpInsights } from '@/hooks/useGfpInsights';
import { GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

export const GfpInsightList: React.FC = () => {
  const { data, isLoading, error } = useGfpInsights();

  if (isLoading) return <GfpLoadingState />;
  if (error || !data?.insights?.length) {
    return (
      <GfpUnavailableState message="Insights unavailable. Run ingest-gov-financial-position." />
    );
  }

  return (
    <section className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <h3 className="text-sm font-black uppercase tracking-widest text-white">
        Structural Insights
      </h3>
      <ul className="space-y-2">
        {data.insights.map((line, i) => (
          <li
            key={i}
            className="flex gap-2 text-xs text-white/80 leading-relaxed border-l-2 border-cyan-500/30 pl-3"
          >
            <span className="text-muted-foreground/40 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
