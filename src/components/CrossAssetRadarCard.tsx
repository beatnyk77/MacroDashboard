import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCrossAssetRadar, CrossAssetRadarItem } from '@/hooks/useCrossAssetRadar';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const VIEW_TABS = [
  'Cross-Asset Macro Radar (Desk View)',
  '4-Quadrant Regime Playbook & Allocator',
] as const;

type ViewTab = typeof VIEW_TABS[number];

export const CrossAssetRadarCard: React.FC = () => {
  const { data, isLoading } = useCrossAssetRadar();
  const [activeTab, setActiveTab] = useState<ViewTab>('Cross-Asset Macro Radar (Desk View)');

  return (
    <Card className="w-full bg-[#0d0f14] border border-slate-800/80 backdrop-blur-md rounded-none shadow-2xl overflow-hidden">
      {/* Command Header */}
      <CardHeader className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/90 via-slate-900/40 to-slate-950/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-slate-100 uppercase tracking-tight">
                Cross-Asset Macro Radar & Market Telemetry
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time multi-asset market close observations, rolling percentiles, and performance deltas
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <MetricFreshnessChip metricId={MID.DXY_INDEX} sourceLabel="OpenBB Market Data" />
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
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 animate-pulse">
            LOADING CROSS-ASSET TELEMETRY MATRIX...
          </div>
        ) : !data?.hasData ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            <div className="text-slate-400 uppercase font-bold mb-1">Market Data Ingestion Pending</div>
            <p className="text-slate-600 max-w-md mx-auto">
              Market close series are ingested Mon–Fri at 21:30 UTC via GitHub Actions. Trigger manual ingestion or await next scheduled run.
            </p>
          </div>
        ) : activeTab === 'Cross-Asset Macro Radar (Desk View)' ? (
          <div className="divide-y divide-slate-800/50">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2.5 bg-slate-950/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Asset & Benchmark</div>
              <div className="col-span-2 text-right">Observed Value</div>
              <div className="col-span-1 text-right">1D Δ</div>
              <div className="col-span-1 text-right">5D Δ</div>
              <div className="col-span-1 text-right">30D Δ</div>
              <div className="col-span-3 text-center">52W Percentile</div>
            </div>

            {/* Rows */}
            {data.radarItems.map((item) => (
              <RadarRow key={item.metricId} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 p-6 text-center space-y-3">
              <div className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider">
                Derived Macro Regime Allocator
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-lg mx-auto">
                4-Quadrant Markov transition probabilities and tactical allocation tilts require server-side derived metric observation computation. Real-time market observations are active under Desk View.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 uppercase">
                Status: Awaiting Derived Metric Producer Ingestion
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">NORMALIZATION:</span>
            <span>Historical percentile calculated over 52-week rolling window of observed market closes.</span>
          </div>
          <DataProvenanceBadge
            source="OpenBB & Primary Market Feeds"
            methodology="Canonical Daily Settlement Closes"
            lastVerified={data?.lastUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const RadarRow: React.FC<{ item: CrossAssetRadarItem }> = ({ item }) => {
  if (!item.isAvailable || item.observedValue === null) {
    return (
      <div className="px-5 py-3.5 hover:bg-slate-900/40 transition-colors opacity-60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="col-span-4">
            <div className="font-mono text-sm font-semibold text-slate-300">{item.assetName}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.benchmark}</div>
          </div>
          <div className="col-span-8 text-right font-mono text-xs text-slate-500 italic">
            Observation pending next market close ingestion
          </div>
        </div>
      </div>
    );
  }

  const is1dPos = item.delta1dPct !== null && item.delta1dPct >= 0;
  const is5dPos = item.delta5dPct !== null && item.delta5dPct >= 0;
  const is30dPos = item.delta30dPct !== null && item.delta30dPct >= 0;

  return (
    <div className="px-5 py-3.5 hover:bg-slate-900/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Asset & Benchmark */}
        <div className="col-span-4">
          <div className="font-mono text-sm font-semibold text-slate-100">{item.assetName}</div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-400">{item.benchmark}</span>
            {item.asOfDate && (
              <span className="text-[10px] font-mono text-slate-400">({item.asOfDate})</span>
            )}
          </div>
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
          {item.delta1dPct !== null ? (
            <span className={`text-xs font-semibold ${is1dPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {is1dPos ? '+' : ''}{item.delta1dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>

        {/* 5D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">5D:</span>
          {item.delta5dPct !== null ? (
            <span className={`text-xs font-semibold ${is5dPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {is5dPos ? '+' : ''}{item.delta5dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>

        {/* 30D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">30D:</span>
          {item.delta30dPct !== null ? (
            <span className={`text-xs font-semibold ${is30dPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {is30dPos ? '+' : ''}{item.delta30dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>

        {/* 52W Percentile Bar */}
        <div className="col-span-3">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-400">52W Rank:</span>
            <span className="font-bold text-slate-200">
              {item.percentile52w !== null ? `${item.percentile52w.toFixed(1)}%` : '—'}
            </span>
          </div>
          {item.percentile52w !== null ? (
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
          ) : (
            <div className="w-full h-1.5 bg-slate-950 border border-slate-800" />
          )}
        </div>
      </div>
    </div>
  );
};
