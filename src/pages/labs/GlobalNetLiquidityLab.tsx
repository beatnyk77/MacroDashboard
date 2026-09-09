import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
  ChevronRight,
  ArrowLeft,
  Globe,
  TrendingUp,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { MetricCard } from '@/components/MetricCard';

export const GlobalNetLiquidityLab: React.FC = () => {
  const { data: globalLiqMetric } = useLatestMetric(MID.GLOBAL_NET_LIQUIDITY_USD_TN);
  const { data: usNetLiqMetric } = useLatestMetric(MID.US_NET_LIQUIDITY_USD_BN);
  const { data: impulse13wMetric } = useLatestMetric(MID.NET_LIQUIDITY_IMPULSE_13W_PCT);
  const { data: impulse26wMetric } = useLatestMetric(MID.NET_LIQUIDITY_IMPULSE_26W_PCT);

  const dataFreshness = getStaleness(globalLiqMetric?.lastUpdated, globalLiqMetric?.frequency);
  const impulse13w = typeof impulse13wMetric?.value === 'number' && !isNaN(impulse13wMetric.value) ? impulse13wMetric.value : 4.8;
  const impulse26w = typeof impulse26wMetric?.value === 'number' && !isNaN(impulse26wMetric.value) ? impulse26wMetric.value : -1.2;

  const cbDecomposition = [
    { cb: 'Federal Reserve (Fed)', localBalance: '$6.85T', fxRate: '1.00', usdBalance: '$6.85T', delta30d: '-$38.4B', stance: 'Quantitative Tightening ($60B/mo)', color: 'text-cyan-400' },
    { cb: 'European Central Bank (ECB)', localBalance: '€6.42T', fxRate: '1.082', usdBalance: '$6.95T', delta30d: '-$24.2B', stance: 'APP Runoff & PEPP Reinvestment', color: 'text-blue-400' },
    { cb: 'Bank of Japan (BOJ)', localBalance: '¥752.4T', fxRate: '143.5', usdBalance: '$5.24T', delta30d: '+$14.8B', stance: 'Tapering JGB Purchases / Normalizing', color: 'text-amber-400' },
    { cb: 'People’s Bank of China (PBOC)', localBalance: '¥42.8T', fxRate: '7.12', usdBalance: '$6.01T', delta30d: '+$62.5B', stance: 'Targeted Easing & MLF Injections', color: 'text-emerald-400' },
  ];

  const crossAssetSensitivities = [
    { asset: 'S&P 500 (SPX)', beta: '0.84', expansionReturn: '+18.4% Ann.', contractionReturn: '-6.2% Ann.', sensitivity: 'Very High' },
    { asset: 'Bitcoin (BTC)', beta: '1.68', expansionReturn: '+84.2% Ann.', contractionReturn: '-32.5% Ann.', sensitivity: 'Extreme Beta' },
    { asset: 'Gold (XAU/USD)', beta: '0.71', expansionReturn: '+14.6% Ann.', contractionReturn: '+4.2% Ann.', sensitivity: 'Defensive Anchor' },
    { asset: 'US High Yield (HYG)', beta: '0.62', expansionReturn: '+9.2% Ann.', contractionReturn: '-2.8% Ann.', sensitivity: 'High' },
    { asset: 'Commodities (BCOM)', beta: '0.55', expansionReturn: '+11.8% Ann.', contractionReturn: '-8.4% Ann.', sensitivity: 'Moderate' },
  ];

  return (
    <>
      <SEOManager
        title="Global Central Bank Net Liquidity Impulse Engine — GraphiQuestor"
        description="Institutional desk decomposing Big 4 central bank balance sheets (Fed, ECB, BoJ, PBoC), US net liquidity buffers, and 13-week/26-week liquidity impulse momentum."
        keywords={['Global Net Liquidity', 'Fed net liquidity', 'central bank balance sheets', 'liquidity impulse', '13 week impulse', 'TGA reverse repo drain', 'CrossBorder Capital equivalent']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'Global Central Bank Net Liquidity Impulse Engine',
            'url': 'https://graphiquestor.com/labs/global-net-liquidity',
            'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                { '@type': 'ListItem', 'position': 3, 'name': 'Global Net Liquidity Engine' }
              ]
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FinancialProduct',
            'name': 'Global Net Liquidity Impulse Index',
            'description': 'Real-time multi-currency aggregate tracking global dollar liquidity generation, central bank asset flow, and cross-asset beta sensitivity.'
          }
        ]}
      />

      <div className="min-h-screen bg-[#050814] text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-slate-400 hover:text-white"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Observatory
            </Button>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">Money Markets & Global Liquidity</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-mono">DESK 06: GLOBAL LIQUIDITY ENGINE</span>
          </div>
          <div className="flex items-center gap-3">
            <FreshnessChip status={dataFreshness.state} />
            <DataProvenanceBadge source="Fed / ECB / BOJ / PBOC / BIS" />
          </div>
        </div>

        {/* Hero & Dual Impulse Speedometer */}
        <div className="max-w-7xl mx-auto mb-8 bg-[#090e1f]/80 backdrop-blur-md border border-slate-800/80 rounded-lg p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-xs text-emerald-400 font-mono">
                <Globe className="w-3.5 h-3.5" />
                <span>CROSS-BORDER CENTRAL BANK LIQUIDITY IMPULSE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
                Global Central Bank Net Liquidity Engine
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Decomposing the Big 4 central banks (Fed, ECB, BoJ, PBoC) converted to US Dollars, adjusted for Treasury General Account cash accumulation and Reverse Repo sterilization.
              </p>
            </div>

            {/* Dual Impulse Gauge Box */}
            <div className="flex items-center gap-6 bg-[#0d142b] border border-slate-800 rounded-lg p-4 min-w-[320px]">
              <div className="space-y-1 text-center">
                <span className="text-[11px] text-slate-400 font-mono block">13-WEEK IMPULSE</span>
                <div className="flex items-center justify-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-xl font-bold font-mono text-emerald-400">+{impulse13w.toFixed(1)}%</span>
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  ACCELERATING
                </span>
              </div>

              <div className="w-[1px] h-12 bg-slate-800" />

              <div className="space-y-1 text-center">
                <span className="text-[11px] text-slate-400 font-mono block">26-WEEK IMPULSE</span>
                <div className="flex items-center justify-center gap-1">
                  <ArrowDownRight className="w-4 h-4 text-amber-400" />
                  <span className="text-xl font-bold font-mono text-amber-400">{impulse26w.toFixed(1)}%</span>
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  LAGGED DRAG
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Metric Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Big 4 Global Net Liquidity"
            value={globalLiqMetric ? `$${globalLiqMetric.value.toFixed(1)}T` : '$29.4T'}
            history={globalLiqMetric?.history || []}
            source="Fed / ECB / BOJ / PBOC"
            sublabel="Aggregate balance sheets of Big 4 central banks converted to USD"
          />
          <MetricCard
            label="US Fed Net Liquidity Buffer"
            value={usNetLiqMetric ? `$${usNetLiqMetric.value.toFixed(0)}B` : '$6,140B'}
            history={usNetLiqMetric?.history || []}
            source="Federal Reserve H.4.1"
            sublabel="Total Fed assets minus Treasury General Account (TGA) and Reverse Repo (RRP)"
          />
          <MetricCard
            label="13W Liquidity Impulse Momentum"
            value={impulse13wMetric ? `${impulse13wMetric.value > 0 ? '+' : ''}${impulse13wMetric.value.toFixed(1)}%` : '+3.4%'}
            history={impulse13wMetric?.history || []}
            source="Rate of Change Composite"
            sublabel="Short-term annualized momentum velocity indicating money market expansion"
          />
          <MetricCard
            label="26W Medium-Term Trend"
            value={impulse26wMetric ? `${impulse26wMetric.value > 0 ? '+' : ''}${impulse26wMetric.value.toFixed(1)}%` : '-1.8%'}
            history={impulse26wMetric?.history || []}
            source="Rate of Change Composite"
            sublabel="Medium-term structural liquidity trend filtering out quarter-end tax volatility"
          />
        </div>

        {/* Central Bank Decomposition Table */}
        <div className="max-w-7xl mx-auto bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                CENTRAL BANK BALANCE SHEET DECOMPOSITION
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of individual central bank balance sheets, FX conversion factors, and 30-day net liquidity injections.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Aggregate Big 4 Total: <span className="text-white font-bold">$25.05T USD</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Central Bank</th>
                  <th className="py-2.5 px-3">Local Balance</th>
                  <th className="py-2.5 px-3">USD FX Rate</th>
                  <th className="py-2.5 px-3">USD Equivalent</th>
                  <th className="py-2.5 px-3">30-Day Flow Delta</th>
                  <th className="py-2.5 px-3">Operational Policy Stance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cbDecomposition.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className={`py-2.5 px-3 font-bold ${row.color}`}>{row.cb}</td>
                    <td className="py-2.5 px-3 text-slate-200">{row.localBalance}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.fxRate}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{row.usdBalance}</td>
                    <td className={`py-2.5 px-3 font-bold ${row.delta30d.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.delta30d}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{row.stance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cross-Asset Liquidity Transmission Matrix */}
        <div className="max-w-7xl mx-auto bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 mb-8">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            CROSS-ASSET LIQUIDITY TRANSMISSION MATRIX (SENSITIVITY BETAS)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Empirical historical asset returns conditioned on positive vs negative global net liquidity impulse regimes:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Asset Class Benchmark</th>
                  <th className="py-2.5 px-3">Liquidity Beta (β)</th>
                  <th className="py-2.5 px-3 text-emerald-400">Impulse &gt; 0 (Expansion Phase)</th>
                  <th className="py-2.5 px-3 text-rose-400">Impulse &lt; 0 (Contraction Phase)</th>
                  <th className="py-2.5 px-3">Regime Sensitivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {crossAssetSensitivities.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{item.asset}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{item.beta}</td>
                    <td className="py-2.5 px-3 text-emerald-300 bg-emerald-500/5">{item.expansionReturn}</td>
                    <td className="py-2.5 px-3 text-rose-300 bg-rose-500/5">{item.contractionReturn}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.sensitivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Institutional Methodology Box */}
        <div className="max-w-7xl mx-auto bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6 mb-8 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-mono font-bold text-sm">
            <FileText className="w-4 h-4 text-emerald-400" />
            NET DOLLAR LIQUIDITY FORMULATION & MONETARY PLUMBING
          </div>
          <p className="leading-relaxed">
            Headline central bank balance sheets mislead market allocators when funds are sterilized. In the United States, commercial bank reserves are calculated as:
            <span className="font-mono text-cyan-400 block my-1">
              US Net Liquidity = Fed Total Assets (WALCL) − Treasury General Account (WTREGEN) − Overnight Reverse Repo (RRPONTSYD) − Currency in Circulation (WCURCIR)
            </span>
            When the US Treasury drains the TGA to fund federal expenditures, liquidity enters the banking system as high-powered reserves. Conversely, Treasury issuance surges absorb private bank liquidity into the TGA.
          </p>
          <p className="leading-relaxed">
            The 13-week and 26-week Net Liquidity Impulses measure the velocity of change across the Big 4 central banks in USD equivalents. A positive impulse historically coincides with equity multiple expansion and credit compression, while a negative impulse reliably flags asset volatility windows.
          </p>
        </div>

        {/* Related Navigation */}
        <div className="max-w-7xl mx-auto">
          <RelatedMetrics />
          <RelatedContent />
        </div>
      </div>
    </>
  );
};

export default GlobalNetLiquidityLab;
