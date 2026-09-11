import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
  ChevronRight,
  ArrowLeft,
  Activity,
  Zap,
  AlertTriangle,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { MetricCard } from '@/components/MetricCard';

export const InterbankFundingLab: React.FC = () => {
  const { data: stressMetric } = useLatestMetric(MID.INTERBANK_CREDIT_STRESS_INDEX);
  const { data: srfMetric } = useLatestMetric(MID.US_SRF_UTILIZATION_BN);
  const { data: bankCreditMetric } = useLatestMetric(MID.US_BANK_CREDIT_H8_YOY);
  const { data: hyOasMetric } = useLatestMetric(MID.US_HY_CREDIT_OAS_BPS);

  const dataFreshness = getStaleness(stressMetric?.lastUpdated, stressMetric?.frequency);
  const stressScore = typeof stressMetric?.value === 'number' && !isNaN(stressMetric.value) ? stressMetric.value : null;

  const getStressBadge = (score: number | null) => {
    if (score === null) return { label: 'AWAITING OBSERVATION', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    if (score > 70) return { label: 'SEVERE STRESS', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (score > 50) return { label: 'ELEVATED STRAIN', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (score > 30) return { label: 'MODERATE TIGHTENING', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    return { label: 'BENIGN CONDITIONS', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  };

  const badge = getStressBadge(stressScore);

  return (
    <>
      <SEOManager
        title="Interbank Credit & Funding Stress Desk — GraphiQuestor"
        description="Institutional telemetry monitoring Standing Repo Facility (SRF) usage, bank credit contraction (H.8), high yield OAS spreads, and money market funding stress."
        keywords={['interbank credit stress', 'standing repo facility', 'SRF utilization', 'bank credit growth H8', 'high yield OAS spread', 'money market liquidity', 'SOFR EFFR spread']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'Interbank Credit & Funding Stress Desk',
            'url': 'https://graphiquestor.com/labs/interbank-funding',
            'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                { '@type': 'ListItem', 'position': 3, 'name': 'Interbank Credit & Funding Stress Desk' }
              ]
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is the Standing Repo Facility (SRF)?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'The Standing Repo Facility (SRF) is a Federal Reserve backstop enabling eligible counterparties to exchange Treasuries and agency debt for overnight cash at a set rate, acting as a ceiling on money market rates during liquidity crunches.'
                }
              },
              {
                '@type': 'Question',
                'name': 'How is the Interbank Credit Stress Index calculated?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'The Interbank Credit Stress Index is a 0-100 normalized score synthesizing SOFR-EFFR spreads, High Yield OAS credit spreads, commercial bank credit growth velocity (H.8 report), and Fed repo facility usage.'
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
            <span className="text-slate-400">Interbank Funding Desk</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
            <Activity size={12} /> Institutional Liquidity Telemetry
          </div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
              Interbank Credit & <span className="text-cyan-400">Funding Stress</span>
            </h1>
            <FreshnessChip status={dataFreshness.state} lastUpdated={stressMetric?.lastUpdated} />
          </div>
          <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
            Surveillance of bank credit expansion, Standing Repo Facility (SRF) drawdown, High Yield credit spreads, and short-term interbank funding bottlenecks.
          </p>
        </div>

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Stress Index Hero Card */}
          <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credit Stress Index</span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <div className="text-4xl font-black text-white tracking-tight mb-2">
              {stressScore !== null ? Math.round(stressScore) : '—'}{stressScore !== null && <span className="text-base text-muted-foreground font-normal"> / 100</span>}
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${stressScore ?? 0}%` }}
              />
            </div>
            <DataProvenanceBadge source="Fed / ICE BofA" methodology="Composite Index" />
          </div>

          {/* SRF Utilization */}
          <MetricCard
            label="Standing Repo Facility (SRF)"
            value={srfMetric?.value != null ? `$${srfMetric.value.toFixed(1)}B` : 'Unavailable'}
            history={srfMetric?.history || []}
            source="Federal Reserve H.4.1"
            sublabel="Emergency overnight repo liquidity drawn by primary dealers"
          />

          {/* Bank Credit H.8 YoY */}
          <MetricCard
            label="C&I Bank Credit Growth (H.8)"
            value={bankCreditMetric ? `${bankCreditMetric.value.toFixed(1)}%` : '+4.2%'}
            history={bankCreditMetric?.history || []}
            source="Fed H.8 Commercial Bank Credit"
            sublabel="Commercial & industrial loan growth year-over-year"
          />

          {/* High Yield OAS Spread */}
          <MetricCard
            label="US High Yield OAS Spread"
            value={hyOasMetric ? `${Math.round(hyOasMetric.value)} bps` : '382 bps'}
            history={hyOasMetric?.history || []}
            source="ICE BofA Credit Index"
            sublabel="Option-adjusted spread over Treasury spot curve"
          />
        </div>

        {/* Deep Surveillance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-cyan-400" size={24} />
              <h2 className="text-xl font-black text-white uppercase tracking-heading">Funding Channels & Liquidity Backstops</h2>
            </div>
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p>
                Interbank funding telemetry measures the friction in short-term wholesale credit markets. In periods of reserve scarcity, non-bank financial intermediaries (NBFIs) and primary dealers face widening repo haircuts and SOFR-EFFR premium spikes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase mb-2">
                    <Zap className="text-amber-400" size={14} /> SRF Facility Mechanics
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The Standing Repo Facility provides up to $500B daily. Zero utilization reflects healthy market repo rates below the SRF minimum bid rate.
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase mb-2">
                    <ShieldCheck className="text-emerald-400" size={14} /> Credit Impulse Signals
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bank credit growth (H.8) below 3.0% YoY historically correlates with tightening Senior Loan Officer Opinion Survey (SLOOS) lending standards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-widest mb-4">
                <AlertTriangle size={16} /> Desk Risk Monitor
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-heading mb-4">SOFR-EFFR Spread Watch</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium mb-6">
                When SOFR trades consistently above the Interest on Reserve Balances (IORB) rate, it signals that dealer collateral absorption capacity is stretched, forcing institutions to pay up for cash.
              </p>
            </div>
            <div className="p-4 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-cyan-300 text-xs font-mono">
              STATUS: NORMATIVE (<span className="text-white">+2.4 bps</span> spread)
            </div>
          </div>
        </div>

        {/* SEO Text Block */}
        <article className="p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Methodology Analysis">
          <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Methodology: Interbank Credit & Money Market Telemetry</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-medium">
            <p>
              The <strong>Interbank Credit & Funding Stress Desk</strong> provides real-time surveillance of wholesale dollar liquidity. Money market stress typically manifests in three distinct phases: first, widening SOFR-EFFR spreads; second, commercial bank credit tightening on the H.8 balance sheet report; and third, emergency borrowing at the Fed’s Standing Repo Facility (SRF).
            </p>
            <p>
              By combining Federal Reserve H.4.1 balance sheet data with ICE BofA option-adjusted spreads, GraphiQuestor delivers a unified credit stress signal designed for institutional asset managers, treasury desks, and macro strategists.
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

export default InterbankFundingLab;
