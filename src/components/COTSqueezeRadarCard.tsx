import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCOTPositioning, COTAssetPositioning } from '@/hooks/useCOTPositioning';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const CATEGORY_TABS = [
  'All Assets',
  'Rates',
  'Precious Metals',
  'Energy',
  'Currencies',
  'Equities',
] as const;

type CategoryTab = typeof CATEGORY_TABS[number];

export const COTSqueezeRadarCard: React.FC = () => {
  const { data, isLoading } = useCOTPositioning();
  const [activeTab, setActiveTab] = useState<CategoryTab>('All Assets');

  const items = data?.items || [];
  const filteredItems = activeTab === 'All Assets'
    ? items
    : items.filter((item) => item.category === activeTab);

  return (
    <Card className="w-full bg-[#0d0f14]/90 border border-slate-800/80 backdrop-blur-md rounded-none shadow-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/60 to-slate-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-slate-100 uppercase tracking-tight">
                CFTC Commitments of Traders (COT) Positioning
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Speculator net positioning & 3-year squeeze risk telemetry
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <MetricFreshnessChip metricId={MID.COT_UST_10Y_NET_SPEC} sourceLabel="CFTC Weekly" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto no-scrollbar pt-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 bg-slate-900/50 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/40'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </CardHeader>

      {/* Content Body */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 animate-pulse">
            LOADING COT TELEMETRY MATRIX...
          </div>
        ) : !data?.hasData ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            <div className="text-slate-400 uppercase font-bold mb-1">COT Telemetry Awaiting Ingestion</div>
            <p className="text-slate-600 max-w-md mx-auto">
              Weekly CFTC Commitments of Traders reports are scheduled for ingestion on Friday post-release (21:30 UTC).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-950/40 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Asset & Exchange</div>
              <div className="col-span-2 text-right">Net Speculator</div>
              <div className="col-span-2 text-right">1W Delta</div>
              <div className="col-span-3 text-center">3Y Percentile Rank</div>
              <div className="col-span-2 text-right">Squeeze Risk</div>
            </div>

            {/* Rows */}
            {filteredItems.map((item) => (
              <COTRowItem key={item.metricId} item={item} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">METHODOLOGY:</span>
            <span>Rolling percentile rank of leveraged money net exposure across stored observations.</span>
          </div>
          <DataProvenanceBadge
            source="CFTC Financial & Disaggregated Futures"
            methodology="Traders in Financial Futures (TFF)"
            lastVerified={data?.lastUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface COTRowItemProps {
  item: COTAssetPositioning;
}

const COTRowItem: React.FC<COTRowItemProps> = ({ item }) => {
  if (!item.isAvailable || item.netSpecContracts === null) {
    return (
      <div className="px-5 py-4 hover:bg-slate-900/40 transition-colors opacity-60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="col-span-3">
            <span className="font-mono text-sm font-semibold text-slate-300">{item.assetName}</span>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.symbol}</div>
          </div>
          <div className="col-span-9 text-right font-mono text-xs text-slate-500 italic">
            Observation pending next weekly CFTC report
          </div>
        </div>
      </div>
    );
  }

  const isNetLong = item.netSpecContracts >= 0;
  const isDeltaPositive = item.delta1wContracts !== null && item.delta1wContracts >= 0;

  return (
    <div className="px-5 py-4 hover:bg-slate-900/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Asset & Category */}
        <div className="col-span-3">
          <div className="font-mono text-sm font-semibold text-slate-100">{item.assetName}</div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 border border-cyan-900/40">
              {item.symbol}
            </span>
            {item.asOfDate && (
              <span className="text-[10px] font-mono text-slate-400">As of {item.asOfDate}</span>
            )}
          </div>
        </div>

        {/* Net Speculator */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400 lg:hidden">Net Spec:</span>
          <span
            className={`font-mono text-sm font-bold ${
              isNetLong ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetLong ? '+' : ''}
            {item.netSpecContracts.toLocaleString()}
            <span className="text-[10px] font-normal text-slate-400 ml-1">ctr</span>
          </span>
        </div>

        {/* 1W Delta */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400 lg:hidden">1W Delta:</span>
          {item.delta1wContracts !== null ? (
            <span
              className={`font-mono text-xs font-semibold ${
                isDeltaPositive ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {isDeltaPositive ? '▲ +' : '▼ '}
              {item.delta1wContracts.toLocaleString()}
            </span>
          ) : (
            <span className="font-mono text-xs text-slate-500">—</span>
          )}
        </div>

        {/* 3Y Percentile Bar */}
        <div className="col-span-3">
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400">3Y Percentile:</span>
            <span className="font-bold text-slate-200">
              {item.percentile3y !== null ? `${item.percentile3y.toFixed(1)}%` : '—'}
            </span>
          </div>
          {item.percentile3y !== null ? (
            <div className="w-full h-2 bg-slate-950 border border-slate-800 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[5%] bg-rose-500/20 border-r border-rose-500/40" />
              <div className="absolute right-0 top-0 bottom-0 w-[5%] bg-amber-500/20 border-l border-amber-500/40" />
              <div
                className={`h-full transition-all duration-500 ${
                  item.percentile3y <= 5
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                    : item.percentile3y >= 95
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                    : item.percentile3y > 50
                    ? 'bg-emerald-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(Math.max(item.percentile3y, 2), 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-2 bg-slate-950 border border-slate-800" />
          )}
        </div>

        {/* Squeeze Risk Status Pill */}
        <div className="col-span-2 lg:text-right flex lg:justify-end">
          <SignalPill signal={item.squeezeSignal} />
        </div>
      </div>
    </div>
  );
};

const SignalPill: React.FC<{ signal: COTAssetPositioning['squeezeSignal'] }> = ({ signal }) => {
  switch (signal) {
    case 'BULL_SQUEEZE_RISK':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/80 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
          ⚡ BULL SQUEEZE RISK
        </span>
      );
    case 'CROWDED_LONG':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/80 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
          ⚠️ CROWDED LONG
        </span>
      );
    case 'MODERATE_LONG':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
          MODERATE LONG
        </span>
      );
    case 'MODERATE_SHORT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-950/50 text-cyan-300 border border-cyan-800/50">
          SHORT BIAS
        </span>
      );
    case 'NEUTRAL_RANGE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
          NEUTRAL RANGE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-850">
          PENDING DATA
        </span>
      );
  }
};
