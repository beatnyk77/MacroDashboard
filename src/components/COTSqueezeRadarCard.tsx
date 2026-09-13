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
    <Card className="w-full bg-card dark:bg-[#0d0f14]/90 border border-border dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="p-5 border-b border-border dark:border-slate-800/60 bg-muted/40 dark:bg-gradient-to-r dark:from-slate-950/60 dark:to-slate-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
            <CardTitle className="font-mono text-base md:text-lg font-bold text-foreground uppercase tracking-tight">
                CFTC Commitments of Traders (COT) Positioning
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Speculator net positioning and stored-window squeeze telemetry
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
                className={`px-3 py-1 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap rounded-md ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-muted-foreground bg-card hover:bg-muted hover:text-foreground border border-border'
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
          <div className="p-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
            LOADING COT TELEMETRY MATRIX...
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2.5 bg-muted/40 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">Asset & Exchange</div>
                <div className="col-span-2 text-right">Net Speculator</div>
                <div className="col-span-2 text-right">1W Delta</div>
                <div className="col-span-3 text-center">Stored Percentile Rank</div>
                <div className="col-span-2 text-right">Squeeze Risk</div>
              </div>

            {/* Rows */}
            {filteredItems.map((item) => (
              <COTRowItem key={item.metricId} item={item} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span className="text-foreground font-bold">METHODOLOGY:</span>
            <span>Signals require at least 52 official weekly observations per contract.</span>
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
  const isNetLong = item.netSpecContracts !== null && item.netSpecContracts >= 0;
  const isDeltaPositive = item.delta1wContracts !== null && item.delta1wContracts >= 0;

  return (
    <div className="px-5 py-4 hover:bg-muted/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Asset & Category */}
        <div className="col-span-3">
          <div className="font-mono text-sm font-semibold text-foreground">{item.assetName}</div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-950/40 px-1.5 py-0.5 border border-cyan-500/30 rounded">
              {item.symbol}
            </span>
            {item.asOfDate ? (
              <span className="text-[10px] font-mono text-muted-foreground">As of {item.asOfDate}</span>
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground">Awaiting CFTC ingest</span>
            )}
          </div>
        </div>

        {/* Net Speculator */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-muted-foreground lg:hidden">Net Spec:</span>
          {item.netSpecContracts !== null ? (
            <span
              className={`font-mono text-sm font-bold ${
                isNetLong ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isNetLong ? '+' : ''}
              {item.netSpecContracts.toLocaleString()}
              <span className="text-[10px] font-normal text-muted-foreground ml-1">ctr</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">Awaiting Ingest</span>
          )}
        </div>

        {/* 1W Delta */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-muted-foreground lg:hidden">1W Delta:</span>
          {item.delta1wContracts !== null ? (
            <span
              className={`font-mono text-xs font-semibold ${
                isDeltaPositive ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isDeltaPositive ? '▲ +' : '▼ '}
              {item.delta1wContracts.toLocaleString()}
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* 3Y Percentile Bar */}
        <div className="col-span-3">
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-muted-foreground">Percentile:</span>
            <span className="font-bold text-foreground">
              {item.percentile3y !== null ? `${item.percentile3y.toFixed(1)}%` : '—'}
            </span>
          </div>
          {item.percentile3y !== null ? (
            <div className="w-full h-2 bg-muted border border-border relative overflow-hidden rounded-full">
              <div className="absolute left-0 top-0 bottom-0 w-[5%] bg-rose-500/20 border-r border-rose-500/40" />
              <div className="absolute right-0 top-0 bottom-0 w-[5%] bg-amber-500/20 border-l border-amber-500/40" />
              <div
                className={`h-full transition-all duration-500 ${
                  item.percentile3y <= 5
                    ? 'bg-rose-500'
                    : item.percentile3y >= 95
                    ? 'bg-amber-500'
                    : item.percentile3y > 50
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(Math.max(item.percentile3y, 2), 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-2 bg-muted border border-border rounded-full" />
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
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 rounded animate-pulse">
          BULL SQUEEZE RISK
        </span>
      );
    case 'CROWDED_LONG':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded">
          CROWDED LONG
        </span>
      );
    case 'MODERATE_LONG':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 rounded">
          MODERATE LONG
        </span>
      );
    case 'MODERATE_SHORT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 rounded">
          SHORT BIAS
        </span>
      );
    case 'NEUTRAL_RANGE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
          NEUTRAL RANGE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-muted/60 border border-border rounded">
          DATA UNAVAILABLE
        </span>
      );
  }
};
