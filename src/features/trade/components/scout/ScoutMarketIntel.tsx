import React from 'react';
import { TrendingUp, Shield, ArrowRight } from 'lucide-react';

interface ScoutMarketIntelProps {
  intel: {
    top_trends: string[];
    india_vs_competitors: string;
    path_of_least_resistance: string;
  };
  recommendations: {
    phase_1_markets: string[];
    phase_2_markets: string[];
    certification_notes: string;
    key_risks: string[];
  };
  hsnCode?: string;
}

export const ScoutMarketIntel: React.FC<ScoutMarketIntelProps> = ({ intel, recommendations, hsnCode: _hsnCode }) => {
  const hasPhase1 = recommendations?.phase_1_markets?.length > 0;
  const hasPhase2 = recommendations?.phase_2_markets?.length > 0;
  const hasTrends = intel?.top_trends?.length > 0;
  const hasCertNotes = !!recommendations?.certification_notes?.trim();
  const hasRisks = recommendations?.key_risks?.length > 0;
  const hasCompetitive = !!intel?.india_vs_competitors?.trim();
  const hasPath = !!intel?.path_of_least_resistance?.trim();

  return (
    <div className="px-8 lg:px-16 py-16 bg-[#020617]">
      {/* Section header */}
      <div className="mb-10">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Market Intelligence</div>
        <h2 className="text-2xl font-black tracking-tight text-white">Strategic Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Trends */}
        {hasTrends && (
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Market Momentum</span>
            </div>
            <ul className="space-y-4">
              {intel.top_trends.map((trend, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-white/50 leading-relaxed">
                  <span className="text-blue-500/60 font-black font-mono text-[10px] mt-0.5 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-white/55 leading-snug text-xs">{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Column 2: Competitive + Certifications */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
          {hasCompetitive && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">India vs. Competitors</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{intel.india_vs_competitors}</p>
            </div>
          )}

          {hasCertNotes && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Certifications Required</span>
              <p className="text-xs text-emerald-400/70 leading-snug">{recommendations.certification_notes}</p>
            </div>
          )}

          {hasRisks && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/70">Key Risks</span>
              <ul className="space-y-1.5">
                {recommendations.key_risks.map((risk, idx) => (
                  <li key={idx} className="text-[11px] text-white/30 flex gap-2">
                    <span className="text-rose-500/40 mt-0.5">→</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Column 3: Path of Least Resistance + Phase Markets */}
        <div className="bg-blue-600 border border-blue-500/20 rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 flex flex-col gap-6">

            {hasPath && (
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200/60">Principal Insight</span>
                <p className="text-base font-bold text-white leading-snug">
                  "{intel.path_of_least_resistance}"
                </p>
              </div>
            )}

            {(hasPhase1 || hasPhase2) && (
              <div className="flex flex-col gap-4 border-t border-white/10 pt-5">
                {hasPhase1 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-white/50" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Phase 1 · Immediate</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendations.phase_1_markets.map(m => (
                        <span key={m} className="px-2.5 py-1 bg-white/15 text-white text-[10px] font-bold rounded-lg">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {hasPhase2 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-white/30" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Phase 2 · Pipeline</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendations.phase_2_markets.map(m => (
                        <span key={m} className="px-2.5 py-1 bg-white/8 text-white/60 text-[10px] font-bold rounded-lg border border-white/10">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
