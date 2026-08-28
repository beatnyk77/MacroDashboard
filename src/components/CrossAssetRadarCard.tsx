import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCrossAssetRadar, CrossAssetRadarItem, PlaybookAssetAllocation } from '@/hooks/useCrossAssetRadar';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';

const VIEW_TABS = [
  'Cross-Asset Macro Radar (Desk View)',
  '4-Quadrant Regime Playbook & Allocator',
] as const;

type ViewTab = typeof VIEW_TABS[number];

export const CrossAssetRadarCard: React.FC = () => {
  const { data, isLoading } = useCrossAssetRadar();
  const [activeTab, setActiveTab] = useState<ViewTab>('Cross-Asset Macro Radar (Desk View)');

  if (isLoading || !data) {
    return (
      <div className="w-full min-h-[400px] bg-slate-950/80 border border-slate-800 p-8 flex items-center justify-center font-mono text-xs text-slate-500 animate-pulse">
        LOADING CROSS-ASSET MACRO RADAR & REGIME PLAYBOOK...
      </div>
    );
  }

  const { regime, radarItems, allocator } = data;

  return (
    <Card className="w-full bg-[#0d0f14] border border-slate-800/80 backdrop-blur-md rounded-none shadow-2xl overflow-hidden">
      {/* Command Header */}
      <CardHeader className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-slate-950/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-slate-100 uppercase tracking-tight">
                Cross-Asset Macro Radar & Regime Playbook
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Multi-asset regime sensitivities, rolling 52-week percentiles, and tactical allocation tilts
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-mono bg-amber-950/80 text-amber-300 px-2.5 py-0.5 border border-amber-600/80 shadow-[0_0_10px_rgba(251,191,36,0.2)] font-bold">
              ⚡ {regime.name} ({regime.confidencePct}% CONF.)
            </span>
            <MetricFreshnessChip staleness="fresh" customLabel="RADAR LIVE" />
          </div>
        </div>

        {/* 4-Quadrant Status Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-1">
          {/* Quad I */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-2.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Quad I: Goldilocks</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-slate-400">Growth ↑ Infl ↓</span>
              <span className="font-mono text-sm font-bold text-slate-400">{regime.probabilities.quadrantI}%</span>
            </div>
          </div>

          {/* Quad II */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-2.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Quad II: Reflation</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-slate-400">Growth ↑ Infl ↑</span>
              <span className="font-mono text-sm font-bold text-slate-400">{regime.probabilities.quadrantII}%</span>
            </div>
          </div>

          {/* Quad III - Active */}
          <div className="bg-amber-950/30 border border-amber-500/60 p-2.5 shadow-[0_0_12px_rgba(251,191,36,0.1)]">
            <div className="text-[10px] font-mono text-amber-300 uppercase font-bold flex items-center justify-between">
              <span>Quad III: Stagflation</span>
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-amber-400/90 font-medium">Growth ↓ Infl ↑</span>
              <span className="font-mono text-sm font-black text-amber-300">{regime.probabilities.quadrantIII}% ACTIVE</span>
            </div>
          </div>

          {/* Quad IV */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-2.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Quad IV: Contraction</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-slate-400">Growth ↓ Infl ↓</span>
              <span className="font-mono text-sm font-bold text-slate-400">{regime.probabilities.quadrantIV}%</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto no-scrollbar pt-1">
          {VIEW_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 bg-slate-900/50 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/40'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </CardHeader>

      {/* Main Content */}
      <CardContent className="p-0">
        {activeTab === 'Cross-Asset Macro Radar (Desk View)' && (
          <div className="divide-y divide-slate-800/50">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2.5 bg-slate-950/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Asset & Benchmark</div>
              <div className="col-span-2 text-right">Observed Value</div>
              <div className="col-span-1 text-right">1D Δ</div>
              <div className="col-span-1 text-right">5D Δ</div>
              <div className="col-span-2 text-center">52W Percentile</div>
              <div className="col-span-3 text-right">Regime Sensitivity Tilt</div>
            </div>

            {/* Rows */}
            {radarItems.map((item) => (
              <RadarRow key={item.metricId} item={item} />
            ))}
          </div>
        )}

        {activeTab === '4-Quadrant Regime Playbook & Allocator' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 p-4">
              <div className="text-xs font-mono text-cyan-300 font-bold uppercase">
                Active Tactical Playbook for {regime.name}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Historical asset class performance and recommended tilts based on empirical macroeconomic regime modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {allocator.map((alloc) => (
                <div
                  key={alloc.assetClass}
                  className="bg-slate-950/40 border border-slate-800/60 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-slate-900/30 transition-colors"
                >
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-100">{alloc.assetClass}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Recommended Vehicle: <span className="text-slate-300">{alloc.recommendedVehicle}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">Quad III Return</div>
                      <div className="text-sm font-bold text-emerald-400">{alloc.historicalReturnQuad}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">Sharpe Ratio</div>
                      <div className="text-sm font-semibold text-cyan-300">{alloc.sharpeRatioQuad.toFixed(2)}</div>
                    </div>
                    <TiltBadge tilt={alloc.tacticalTilt} color={alloc.tiltColor} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">MODELING:</span>
            <span>4-Quadrant Growth/Inflation Markov regime classifier with 52-week percentile normalization.</span>
          </div>
          <DataProvenanceBadge
            sourceName="GraphiQuestor Signal Engine"
            sourceUrl="/methods/macro-regimes"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const RadarRow: React.FC<{ item: CrossAssetRadarItem }> = ({ item }) => {
  const is1dPos = item.delta1dPct >= 0;
  const is5dPos = item.delta5dPct >= 0;

  return (
    <div className="px-5 py-3.5 hover:bg-slate-900/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Asset & Benchmark */}
        <div className="col-span-3">
          <div className="font-mono text-sm font-semibold text-slate-100">{item.assetName}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.benchmark}</div>
        </div>

        {/* Observed Value */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">Value:</span>
          <span className="text-sm font-bold text-slate-100">
            {item.unit}{item.observedValue > 1000 ? item.observedValue.toLocaleString() : item.observedValue.toFixed(2)}
          </span>
        </div>

        {/* 1D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">1D:</span>
          <span className={`text-xs font-semibold ${is1dPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {is1dPos ? '+' : ''}{item.delta1dPct.toFixed(2)}%
          </span>
        </div>

        {/* 5D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">5D:</span>
          <span className={`text-xs font-semibold ${is5dPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {is5dPos ? '+' : ''}{item.delta5dPct.toFixed(2)}%
          </span>
        </div>

        {/* 52W Percentile Bar */}
        <div className="col-span-2">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-400">52W Rank:</span>
            <span className="font-bold text-slate-200">{item.percentile52w.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 border border-slate-800 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                item.percentile52w >= 85
                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                  : item.percentile52w <= 20
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(Math.max(item.percentile52w, 2), 100)}%` }}
            />
          </div>
        </div>

        {/* Regime Sensitivity */}
        <div className="col-span-3 lg:text-right flex lg:flex-col lg:items-end justify-between items-center">
          <TiltTag tilt={item.regimeSensitivity.tilt} />
          <span className="text-[10px] font-mono text-slate-400 text-right mt-0.5 truncate max-w-[220px]">
            {item.regimeSensitivity.rationale}
          </span>
        </div>
      </div>
    </div>
  );
};

const TiltTag: React.FC<{ tilt: CrossAssetRadarItem['regimeSensitivity']['tilt'] }> = ({ tilt }) => {
  switch (tilt) {
    case 'STRONG_OVERWEIGHT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
          ▲ STRONG OVERWEIGHT
        </span>
      );
    case 'OVERWEIGHT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/50 text-emerald-300 border border-emerald-700/50">
          ▲ OVERWEIGHT
        </span>
      );
    case 'UNDERWEIGHT':
    case 'STRONG_UNDERWEIGHT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-700/60">
          ▼ UNDERWEIGHT
        </span>
      );
    case 'NEUTRAL':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
          ● NEUTRAL
        </span>
      );
  }
};

const TiltBadge: React.FC<{
  tilt: PlaybookAssetAllocation['tacticalTilt'];
  color: PlaybookAssetAllocation['tiltColor'];
}> = ({ tilt, color }) => {
  if (color === 'emerald') {
    return (
      <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/80">
        ▲ OVERWEIGHT
      </span>
    );
  }
  if (color === 'rose') {
    return (
      <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/80">
        ▼ UNDERWEIGHT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-950/50 text-cyan-300 border border-cyan-800/50">
      ● NEUTRAL
    </span>
  );
};
