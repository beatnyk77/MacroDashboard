import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSovereignStressDesk, SovereignHolderFlow } from '@/hooks/useSovereignStressDesk';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const DESK_TABS = [
  'TIC Foreign Treasury Flows Matrix',
  'Offshore Dollar Funding Stress',
] as const;

type DeskTab = typeof DESK_TABS[number];

export const SovereignStressDeskCard: React.FC = () => {
  const { data, isLoading } = useSovereignStressDesk();
  const [activeTab, setActiveTab] = useState<DeskTab>('TIC Foreign Treasury Flows Matrix');

  const { gauges, ticHolders, fundingStress, lastUpdated, hasData } = data || {
    gauges: {
      totalForeignHoldingsBn: null,
      totalForeignYoYPct: null,
      chinaHeldBn: null,
      chinaYoYPct: null,
      japanHeldBn: null,
      japanYoYPct: null,
      asOfDate: null,
    },
    ticHolders: [],
    fundingStress: {
      swapLinesOutstandingMn: null,
      swapLinesDate: null,
    },
    lastUpdated: null,
    hasData: false,
  };

  return (
    <Card className="w-full bg-[#0e1015] border border-slate-800/80 backdrop-blur-md rounded-none shadow-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.7)]" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-slate-100 uppercase tracking-tight">
                Sovereign Stress & Cross-Border Capital Flows Desk
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              US Treasury International Capital (TIC) positions, foreign sovereign holdings, and offshore funding telemetry
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <MetricFreshnessChip metricId={MID.FX_SWAP_LINES || 'FX_SWAP_LINES'} sourceLabel="US Treasury TIC" />
          </div>
        </div>

        {/* 3 Top Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-1">
          {/* Gauge 1: Foreign UST Holdings */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Total Foreign UST Holdings
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg md:text-xl font-mono font-bold text-slate-100">
                {gauges.totalForeignHoldingsBn !== null
                  ? `$${(gauges.totalForeignHoldingsBn / 1000).toFixed(2)}T`
                  : '—'}
              </span>
              {gauges.asOfDate && (
                <span className="text-[10px] font-mono text-slate-400">({gauges.asOfDate})</span>
              )}
            </div>
          </div>

          {/* Gauge 2: China (PBoC) Held */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              China (PBoC) Held
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg md:text-xl font-mono font-bold text-slate-100">
                {gauges.chinaHeldBn !== null ? `$${gauges.chinaHeldBn.toFixed(1)}B` : '—'}
              </span>
              {gauges.chinaYoYPct !== null && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    gauges.chinaYoYPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {gauges.chinaYoYPct >= 0 ? '+' : ''}{gauges.chinaYoYPct.toFixed(1)}% YoY
                </span>
              )}
            </div>
          </div>

          {/* Gauge 3: Japan (BoJ) Held */}
          <div className="bg-slate-950/60 border border-slate-800/60 p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Japan (BoJ) Held
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg md:text-xl font-mono font-bold text-slate-100">
                {gauges.japanHeldBn !== null
                  ? `$${(gauges.japanHeldBn / 1000).toFixed(2)}T`
                  : '—'}
              </span>
              {gauges.japanYoYPct !== null && (
                <span
                  className={`text-xs font-mono font-semibold ${
                    gauges.japanYoYPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {gauges.japanYoYPct >= 0 ? '+' : ''}{gauges.japanYoYPct.toFixed(1)}% YoY
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto no-scrollbar pt-1">
          {DESK_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 bg-slate-900/50 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/40'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 animate-pulse">
            LOADING SOVEREIGN CAPITAL FLOWS DESK...
          </div>
        ) : !hasData ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            <div className="text-slate-400 uppercase font-bold mb-1">TIC Data Awaiting Ingestion</div>
            <p className="text-slate-600 max-w-md mx-auto">
              Monthly US Treasury International Capital records will populate upon scheduled ingestion.
            </p>
          </div>
        ) : activeTab === 'TIC Foreign Treasury Flows Matrix' ? (
          <div className="divide-y divide-slate-800/50">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2.5 bg-slate-950/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Sovereign / Jurisdiction</div>
              <div className="col-span-2 text-right">Holdings ($ Bn)</div>
              <div className="col-span-2 text-right">MoM Δ</div>
              <div className="col-span-2 text-right">YoY Δ</div>
              <div className="col-span-3 text-right">Strategic Rationale</div>
            </div>

            {/* Rows */}
            {ticHolders.map((row) => (
              <TICRow key={row.country} row={row} />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-slate-950/60 border border-slate-800/80 p-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono text-cyan-300 font-bold uppercase">
                  Central Bank Liquidity Swap Lines Outstanding
                </span>
                {fundingStress.swapLinesDate && (
                  <span className="text-[10px] font-mono text-slate-400">
                    As of {fundingStress.swapLinesDate}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-100">
                  {fundingStress.swapLinesOutstandingMn !== null
                    ? `$${fundingStress.swapLinesOutstandingMn.toLocaleString()} Mn`
                    : '—'}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  (Fed Weekly Series SWPT)
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-2">
                Monitors global central bank draws on Federal Reserve dollar swap facilities. Elevated draws indicate severe cross-border USD liquidity shortages.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">COVERAGE:</span>
            <span>Monthly US Treasury International Capital (TIC) System & Federal Reserve Balance Sheet.</span>
          </div>
          <DataProvenanceBadge
            source="US Treasury TIC & Federal Reserve"
            methodology="TIC Major Foreign Holders Database"
            lastVerified={lastUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const TICRow: React.FC<{ row: SovereignHolderFlow }> = ({ row }) => {
  const isMomPos = row.momChangePct !== null && row.momChangePct >= 0;
  const isYoyPos = row.yoyChangePct !== null && row.yoyChangePct >= 0;

  return (
    <div className="px-5 py-3.5 hover:bg-slate-900/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Country */}
        <div className="col-span-3">
          <div className="font-mono text-sm font-semibold text-slate-100">{row.country}</div>
          <div className="text-[10px] font-mono text-slate-400">
            {row.pctOfTotalForeign !== null ? `${row.pctOfTotalForeign.toFixed(1)}% of foreign total` : ''}
          </div>
        </div>

        {/* Total Held */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">Held:</span>
          <span className="text-sm font-bold text-slate-100">
            ${row.totalHeldBn.toFixed(1)}B
          </span>
        </div>

        {/* MoM Change */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">MoM:</span>
          {row.momChangePct !== null ? (
            <span className={`text-xs font-semibold ${isMomPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isMomPos ? '+' : ''}{row.momChangePct.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>

        {/* YoY Change */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-slate-400 lg:hidden">YoY:</span>
          {row.yoyChangePct !== null ? (
            <span className={`text-xs font-semibold ${isYoyPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isYoyPos ? '+' : ''}{row.yoyChangePct.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )}
        </div>

        {/* Strategic Motivation */}
        <div className="col-span-3 text-left lg:text-right">
          <span className="text-[10px] font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 border border-slate-800">
            {row.strategicMotivation}
          </span>
        </div>
      </div>
    </div>
  );
};
