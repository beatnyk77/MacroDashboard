import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCrossAssetRadar, CrossAssetRadarItem } from '@/hooks/useCrossAssetRadar';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';

const VIEW_TABS = ['Cross-Asset Macro Radar (Desk View)', 'Regime Model Status'] as const;

type ViewTab = typeof VIEW_TABS[number];

export const CrossAssetRadarCard: React.FC = () => {
  const { data, isLoading } = useCrossAssetRadar();
  const [activeTab, setActiveTab] = useState<ViewTab>('Cross-Asset Macro Radar (Desk View)');

  const radarItems = data?.radarItems || [];

  return (
    <Card className="w-full bg-card dark:bg-[#0d0f14] border border-border dark:border-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden">
      {/* Command Header */}
      <CardHeader className="p-5 border-b border-border dark:border-slate-800/60 bg-muted/40 dark:bg-gradient-to-r dark:from-slate-950/90 dark:via-slate-900/40 dark:to-slate-950/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-foreground uppercase tracking-tight">
                Cross-Asset Macro Radar & Regime Playbook
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Multi-asset market close observations and rolling 52-week percentiles
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-mono bg-muted text-muted-foreground px-2.5 py-0.5 border border-border font-bold rounded">
              REGIME MODEL AWAITING DERIVED PRODUCER
            </span>
            <MetricFreshnessChip metricId={MID.DXY_INDEX} sourceLabel="OpenBB Multi-Vendor" />
          </div>
        </div>

        {/* 4-Quadrant Status Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-1">
          {/* Quad I */}
          <div className="bg-card border border-border p-2.5 rounded-lg shadow-sm">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Quad I: Goldilocks</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-muted-foreground">Growth ↑ Infl ↓</span>
              <span className="font-mono text-sm font-bold text-muted-foreground/60">N/A</span>
            </div>
          </div>

          {/* Quad II */}
          <div className="bg-card border border-border p-2.5 rounded-lg shadow-sm">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Quad II: Reflation</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-muted-foreground">Growth ↑ Infl ↑</span>
              <span className="font-mono text-sm font-bold text-muted-foreground/60">N/A</span>
            </div>
          </div>

          {/* Quad III */}
          <div className="bg-card border border-border p-2.5 rounded-lg shadow-sm">
            <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-between">
              <span>Quad III: Stagflation</span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-muted-foreground">Growth ↓ Infl ↑</span>
              <span className="font-mono text-sm font-bold text-muted-foreground/60">N/A</span>
            </div>
          </div>

          {/* Quad IV */}
          <div className="bg-card border border-border p-2.5 rounded-lg shadow-sm">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Quad IV: Contraction</div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs font-mono text-muted-foreground">Growth ↓ Infl ↓</span>
              <span className="font-mono text-sm font-bold text-muted-foreground/60">N/A</span>
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
                className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap rounded-lg ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-muted-foreground bg-card hover:bg-muted hover:text-foreground border border-border'
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
          <div className="p-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
            LOADING CROSS-ASSET TELEMETRY MATRIX...
          </div>
        ) : activeTab === 'Cross-Asset Macro Radar (Desk View)' ? (
          <div className="divide-y divide-border">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2.5 bg-muted/40 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Asset & Benchmark</div>
              <div className="col-span-2 text-right">Observed Value</div>
              <div className="col-span-1 text-right">1D Δ</div>
              <div className="col-span-1 text-right">5D Δ</div>
              <div className="col-span-1 text-right">30D Δ</div>
              <div className="col-span-3 text-center">52W Percentile</div>
            </div>

            {/* Rows */}
            {radarItems.map((item) => (
              <RadarRow key={item.metricId} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-300 font-bold uppercase">
                Regime Probability Producer Not Deployed
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                This panel will activate after a backend job writes observed growth, inflation, and market-implied regime probabilities into Supabase. Until then, GraphiQuestor only displays raw cross-asset telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Required Input', 'Growth impulse, inflation impulse, and market stress factors'],
                ['Database Contract', 'Derived metric observations or a dedicated regime probability table'],
                ['Display Rule', 'Show probabilities only when the producer has fresh source-backed data'],
                ['Allocator Rule', 'Show tilts only when historical return samples are stored with provenance'],
              ].map(([label, value]) => (
                <div key={label} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
                  <div className="text-xs font-mono text-foreground mt-1">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pb-4">
          <ChartAccessibleTranscript
            takeaway="Cross-Asset Macro Radar evaluates 52-week percentile rankings across multi-asset benchmarks to detect regime shifts across Equities, Sovereign Rates, US Dollar Index, Commodities, and Credit Spreads."
            readingGuide="Percentiles normalize the latest settlement close against trailing 260 sessions (0% = 52W low, 100% = 52W high). 4-Quadrant mapping: Quad I (Goldilocks: Growth ↑, Infl ↓); Quad II (Reflation: Growth ↑, Infl ↑); Quad III (Stagflation: Growth ↓, Infl ↑); Quad IV (Contraction: Growth ↓, Infl ↓)."
            searchKeywords={[
              'Cross-Asset Macro Radar',
              'Regime Playbook',
              '4-Quadrant Macro Model',
              '52-Week Percentile Rank',
              'S&P 500 SPX',
              'Nasdaq 100 NDX',
              'US Dollar Index DXY',
              '10Y Treasury Yield',
              'Gold XAU USD',
              'Brent Crude Oil',
              'High Yield Credit Spreads'
            ]}
            tableData={{
              caption: 'Cross-Asset Market Close Observations and Percentile Matrix',
              headers: ['Asset & Benchmark', 'Observed Close', '1D Δ', '5D Δ', '30D Δ', '52W Percentile'],
              rows: radarItems.map(item => [
                `${item.assetName} (${item.benchmark})`,
                item.observedValue != null ? `${item.unit || ''}${item.observedValue > 1000 ? item.observedValue.toLocaleString() : item.observedValue.toFixed(2)}` : 'Pending',
                item.delta1dPct != null ? `${item.delta1dPct >= 0 ? '+' : ''}${item.delta1dPct.toFixed(1)}%` : '—',
                item.delta5dPct != null ? `${item.delta5dPct >= 0 ? '+' : ''}${item.delta5dPct.toFixed(1)}%` : '—',
                item.delta30dPct != null ? `${item.delta30dPct >= 0 ? '+' : ''}${item.delta30dPct.toFixed(1)}%` : '—',
                item.percentile52w != null ? `${Math.round(item.percentile52w)}%` : '—'
              ])
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/40 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-foreground">NORMALIZATION:</span>
            <span>Percentiles use the latest 260 stored market closes when enough observations exist.</span>
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
  const is1dPos = item.delta1dPct !== null && item.delta1dPct >= 0;
  const is5dPos = item.delta5dPct !== null && item.delta5dPct >= 0;
  const is30dPos = item.delta30dPct !== null && item.delta30dPct >= 0;

  return (
    <div className="px-5 py-3.5 hover:bg-muted/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Asset & Benchmark */}
        <div className="col-span-4">
          <div className="font-mono text-sm font-semibold text-foreground">{item.assetName}</div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-[10px] font-mono text-muted-foreground">{item.benchmark}</span>
            {item.asOfDate && (
              <span className="text-[10px] font-mono text-muted-foreground">({item.asOfDate})</span>
            )}
          </div>
        </div>

        {/* Observed Value */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-muted-foreground lg:hidden">Value:</span>
          {item.observedValue !== null ? (
            <span className="text-sm font-bold text-foreground">
              {item.unit}{item.observedValue > 1000 ? item.observedValue.toLocaleString() : item.observedValue.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs font-mono text-muted-foreground/60 italic">Pending Close</span>
          )}
        </div>

        {/* 1D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-muted-foreground lg:hidden">1D:</span>
          {item.delta1dPct !== null ? (
            <span className={`text-xs font-semibold ${is1dPos ? 'text-emerald-500' : 'text-rose-500'}`}>
              {is1dPos ? '+' : ''}{item.delta1dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </div>

        {/* 5D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-muted-foreground lg:hidden">5D:</span>
          {item.delta5dPct !== null ? (
            <span className={`text-xs font-semibold ${is5dPos ? 'text-emerald-500' : 'text-rose-500'}`}>
              {is5dPos ? '+' : ''}{item.delta5dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </div>

        {/* 30D Delta */}
        <div className="col-span-1 lg:text-right flex lg:block justify-between items-center font-mono">
          <span className="text-[11px] text-muted-foreground lg:hidden">30D:</span>
          {item.delta30dPct !== null ? (
            <span className={`text-xs font-semibold ${is30dPos ? 'text-emerald-500' : 'text-rose-500'}`}>
              {is30dPos ? '+' : ''}{item.delta30dPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </div>

        {/* 52W Percentile Bar */}
        <div className="col-span-3">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-muted-foreground">52W Rank:</span>
            <span className="font-bold text-foreground">
              {item.percentile52w !== null ? `${item.percentile52w.toFixed(1)}%` : '—'}
            </span>
          </div>
          {item.percentile52w !== null ? (
            <div className="w-full h-1.5 bg-muted border border-border rounded-full relative overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  item.percentile52w >= 85
                    ? 'bg-cyan-500 shadow-sm'
                    : item.percentile52w <= 20
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(Math.max(item.percentile52w, 2), 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-1.5 bg-muted border border-border rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
};
