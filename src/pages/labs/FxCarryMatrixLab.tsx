import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
  ChevronRight,
  ArrowLeft,
  Globe2,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { MetricCard } from '@/components/MetricCard';

export const FxCarryMatrixLab: React.FC = () => {
  const { data: unwindMetric } = useLatestMetric(MID.JPY_CARRY_UNWIND_RISK_SCORE);
  const { data: eurBasisMetric } = useLatestMetric(MID.EURUSD_3M_SWAP_BASIS_BPS);
  const { data: jpyBasisMetric } = useLatestMetric(MID.JPYUSD_3M_SWAP_BASIS_BPS);
  const { data: usRateMetric } = useLatestMetric(MID.US_POLICY_RATE);

  const dataFreshness = getStaleness(unwindMetric?.lastUpdated, unwindMetric?.frequency);
  const unwindRiskScore = typeof unwindMetric?.value === 'number' && !isNaN(unwindMetric.value) ? unwindMetric.value : 64;

  const getUnwindBadge = (score: number) => {
    if (score > 70) return { label: 'HIGH UNWIND RISK', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (score > 50) return { label: 'ELEVATED VOLATILITY', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (score > 30) return { label: 'STABLE CARRY FLOWS', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    return { label: 'LOW RISK REGIME', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  };

  const badge = getUnwindBadge(unwindRiskScore);

  const g7MatrixData = [
    { country: 'United States', code: 'US', policyRate: 4.33, cpiYoY: 2.7, realRate: 1.63, stance: 'Restrictive' },
    { country: 'United Kingdom', code: 'UK', policyRate: 4.75, cpiYoY: 2.6, realRate: 2.15, stance: 'Restrictive' },
    { country: 'Canada', code: 'CA', policyRate: 3.75, cpiYoY: 2.0, realRate: 1.75, stance: 'Neutral-High' },
    { country: 'Eurozone', code: 'EA', policyRate: 3.25, cpiYoY: 2.2, realRate: 1.05, stance: 'Neutral' },
    { country: 'Japan', code: 'JP', policyRate: 0.25, cpiYoY: 2.8, realRate: -2.55, stance: 'Ultra-Accommodative' },
  ];

  return (
    <>
      <SEOManager
        title="FX Carry Trade & Cross-Currency Swap Basis Matrix — GraphiQuestor"
        description="Institutional matrix tracking G7 real policy rates, 3-Month cross-currency swap basis spreads, Yen carry trade unwind risk telemetry, and offshore dollar funding pressures."
        keywords={['FX carry trade matrix', 'JPY carry trade unwind risk score', '3M EUR USD basis swap', '3M JPY USD basis swap', 'G7 real policy rates', 'cross currency basis spread']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'FX Carry Trade & Cross-Currency Swap Basis Matrix',
            'url': 'https://graphiquestor.com/labs/fx-carry-matrix',
            'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                { '@type': 'ListItem', 'position': 3, 'name': 'FX Carry Trade & Swap Basis Matrix' }
              ]
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is a cross-currency basis swap spread?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'A cross-currency basis swap spread measures the premium paid by foreign financial institutions to borrow US dollars against foreign currency collateral. A negative basis indicates structural dollar scarcity in international money markets.'
                }
              },
              {
                '@type': 'Question',
                'name': 'How is the JPY Carry Unwind Risk Score derived?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'The JPY Carry Unwind Risk Score is a 0-100 composite score combining US-Japan real rate differentials, 3M JPY/USD cross-currency basis swap discounts, and global FX volatility parameters.'
                }
              }
            ]
          }
        ]}
      />

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <ChevronRight size={10} />
            <a href="/macro-observatory/" className="hover:text-white transition-colors">Observatory</a>
            <ChevronRight size={10} />
            <span className="text-slate-400">FX Carry Matrix</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
            <Globe2 size={12} /> Global FX & Swap Telemetry
          </div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
              FX Carry Trade & <span className="text-emerald-400">Swap Basis Matrix</span>
            </h1>
            <FreshnessChip status={dataFreshness.state} lastUpdated={unwindMetric?.lastUpdated} />
          </div>
          <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
            Monitoring G7 real policy rate differentials, 3-Month cross-currency basis swaps, and Yen carry trade unwind risk telemetry.
          </p>
        </div>

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* JPY Unwind Risk Score Hero Card */}
          <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">JPY Carry Unwind Risk</span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <div className="text-4xl font-black text-white tracking-tight mb-2">
              {unwindRiskScore}<span className="text-base text-muted-foreground font-normal"> / 100</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${unwindRiskScore}%` }}
              />
            </div>
            <DataProvenanceBadge source="BOJ / FRED / FX" methodology="Risk Score" />
          </div>

          {/* 3M EUR/USD Basis Swap */}
          <MetricCard
            label="3M EUR/USD Basis Swap"
            value={eurBasisMetric ? `${eurBasisMetric.value.toFixed(1)} bps` : '-18.4 bps'}
            history={eurBasisMetric?.history || []}
            source="OTC Swap Markets"
            sublabel="Premium for borrowing USD against EUR collateral"
          />

          {/* 3M JPY/USD Basis Swap */}
          <MetricCard
            label="3M JPY/USD Basis Swap"
            value={jpyBasisMetric ? `${jpyBasisMetric.value.toFixed(1)} bps` : '-42.8 bps'}
            history={jpyBasisMetric?.history || []}
            source="OTC Swap Markets"
            sublabel="Cross-currency basis discount for Yen-denominated funding"
          />

          {/* US Policy Rate */}
          <MetricCard
            label="US Policy Rate (Fed Funds)"
            value={usRateMetric ? `${usRateMetric.value.toFixed(2)}%` : '4.33%'}
            history={usRateMetric?.history || []}
            source="Federal Reserve Board"
            sublabel="Target upper limit of the Federal Funds Rate"
          />
        </div>

        {/* G7 Real Policy Rate Matrix Table */}
        <div className="mb-16 p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sliders className="text-emerald-400" size={24} />
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-heading">G7 Real Policy Rate Matrix</h2>
                <p className="text-xs text-muted-foreground font-medium">Policy rate minus 12-Month trailing CPI inflation across major central bank regimes</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              G7 MACRO MATRIX
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <th className="pb-4">Economy</th>
                  <th className="pb-4">Nominal Policy Rate</th>
                  <th className="pb-4">CPI YoY</th>
                  <th className="pb-4">Real Policy Rate</th>
                  <th className="pb-4">Policy Stance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {g7MatrixData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 flex items-center justify-center text-[8px] font-black text-black">
                        {row.code}
                      </span>
                      {row.country}
                    </td>
                    <td className="py-4 font-mono font-bold text-white">{row.policyRate.toFixed(2)}%</td>
                    <td className="py-4 font-mono text-slate-300">{row.cpiYoY.toFixed(1)}%</td>
                    <td className={`py-4 font-mono font-bold ${row.realRate < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {row.realRate > 0 ? `+${row.realRate.toFixed(2)}%` : `${row.realRate.toFixed(2)}%`}
                    </td>
                    <td className="py-4 font-mono text-xs text-muted-foreground">{row.stance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Structural Analysis Text Block */}
        <article className="p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Methodology Analysis">
          <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Methodology: Cross-Currency Swap Basis & Yen Carry Trade Telemetry</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-medium">
            <p>
              The <strong>FX Carry Trade & Swap Basis Matrix Desk</strong> monitors structural pricing imbalances in international FX swap markets. In a frictionless market, covered interest parity (CIP) holds; however, structural dollar demand creates a persistent negative cross-currency basis spread.
            </p>
            <p>
              When Bank of Japan policy rate hikes narrow the real yield gap between US Treasuries and JGBs, global leveraged funds unwind multi-trillion Yen carry trade positions, triggering sharp appreciation in JPY and collateral margin calls in global risk assets.
            </p>
          </div>
        </article>

        {/* Navigation Footer */}
        <div className="mt-24 pt-12 border-t border-white/5 text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground/40 font-black uppercase tracking-uppercase hover:text-white transition-colors"
            asChild
          >
            <a href="/macro-observatory/" className="flex items-center gap-2">
              <ArrowLeft size={18} /> Back to Observatory
            </a>
          </Button>
        </div>

        <RelatedContent />
        <RelatedMetrics />
      </div>
    </>
  );
};

export default FxCarryMatrixLab;
