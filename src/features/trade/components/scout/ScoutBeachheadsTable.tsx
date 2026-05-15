import React from 'react';

interface Beachhead {
  country: string;
  total_market: string;
  india_share: number;
  yoy_growth: number;
  opportunity_score: number;
  priority: string;
  recommended_action: string;
}

interface ScoutBeachheadsTableProps {
  beachheads: Beachhead[];
}

const priorityConfig = {
  NOW:    { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  HIGH:   { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  MEDIUM: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

export const ScoutBeachheadsTable: React.FC<ScoutBeachheadsTableProps> = ({ beachheads }) => {
  if (!beachheads || beachheads.length === 0) return null;

  const displayBeachheads = beachheads.slice(0, 10);

  return (
    <div className="px-8 lg:px-16 py-16">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Priority Beachheads</div>
          <h2 className="text-2xl font-black tracking-tight text-white">Target Markets</h2>
        </div>
        <span className="text-[10px] text-white/20 font-mono">Ranked by Opportunity Score</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-0 border-b border-white/5 bg-white/[0.015]">
          {['Market', 'TAM', 'YoY', 'India Share', 'Score', 'Action'].map(col => (
            <div key={col} className="px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-white/20">{col}</div>
          ))}
        </div>

        {/* Rows */}
        {displayBeachheads.map((bh, idx) => {
          const cfg = priorityConfig[bh.priority as keyof typeof priorityConfig] ?? priorityConfig.MEDIUM;
          const growthPositive = bh.yoy_growth > 0;

          return (
            <div
              key={bh.country}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-0 border-b border-white/[0.04] last:border-none hover:bg-white/[0.025] transition-colors group"
            >
              {/* Country */}
              <div className="px-5 py-4 flex items-center gap-3">
                <span className="text-white/10 font-mono text-xs w-4 tabular-nums shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                <span className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">{bh.country}</span>
              </div>

              {/* TAM */}
              <div className="px-5 py-4 flex items-center">
                <span className="text-sm font-bold text-white/70 font-mono tabular-nums">{bh.total_market}</span>
              </div>

              {/* YoY Growth */}
              <div className="px-5 py-4 flex items-center">
                {bh.yoy_growth !== 0 ? (
                  <span className={`text-xs font-black font-mono tabular-nums ${growthPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {growthPositive ? '+' : ''}{bh.yoy_growth}%
                  </span>
                ) : (
                  <span className="text-white/15 text-xs">—</span>
                )}
              </div>

              {/* India Share */}
              <div className="px-5 py-4 flex items-center">
                {bh.india_share > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, bh.india_share * 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/50 font-mono tabular-nums">{bh.india_share}%</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-emerald-500/60 font-bold">Untapped</span>
                )}
              </div>

              {/* Score */}
              <div className="px-5 py-4 flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black font-mono"
                    style={{
                      background: bh.opportunity_score >= 75
                        ? 'rgba(16,185,129,0.15)'
                        : bh.opportunity_score >= 60
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(255,255,255,0.05)',
                      color: bh.opportunity_score >= 75
                        ? '#10b981'
                        : bh.opportunity_score >= 60
                        ? '#3b82f6'
                        : '#94a3b8',
                    }}
                  >
                    {bh.opportunity_score}
                  </div>
                </div>
              </div>

              {/* Priority + Action */}
              <div className="px-5 py-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {bh.priority}
                </span>
                <span className="text-[10px] text-white/25 italic leading-tight hidden lg:block">{bh.recommended_action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
