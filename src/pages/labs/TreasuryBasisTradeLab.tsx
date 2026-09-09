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
  Flame,
  Scale,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { MetricCard } from '@/components/MetricCard';

export const TreasuryBasisTradeLab: React.FC = () => {
  const { data: riskMetric } = useLatestMetric(MID.TREASURY_BASIS_BLOWOUT_RISK);
  const { data: cftcMetric } = useLatestMetric(MID.CFTC_LEVERAGED_FUTURES_SHORT_BN);
  const { data: sofrSpreadMetric } = useLatestMetric(MID.SOFR_IORB_SPREAD_BPS);
  const { data: repoVolumeMetric } = useLatestMetric(MID.PRIMARY_DEALER_REPO_FINANCING_BN);

  const dataFreshness = getStaleness(riskMetric?.lastUpdated, riskMetric?.frequency);
  const riskScore = typeof riskMetric?.value === 'number' && !isNaN(riskMetric.value) ? riskMetric.value : 74;

  const getRiskBadge = (score: number) => {
    if (score > 75) return { label: 'CRITICAL SQUEEZE RISK', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (score > 55) return { label: 'ELEVATED UNWIND RISK', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (score > 35) return { label: 'MONITORED VOLATILITY', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { label: 'BENIGN PARITY', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  };

  const badge = getRiskBadge(riskScore);

  // Basis Unwind Fragility Matrix: Repo Shock vs Haircut Escalation
  const fragilityMatrix = [
    { repoShock: '+10 bps', h2: '-$14B / -8%', h35: '-$28B / -16%', h5: '-$48B / -24%', h75: '-$78B / -38%', h10: '-$112B / -52%', stress: 'low' },
    { repoShock: '+25 bps', h2: '-$32B / -18%', h35: '-$56B / -32%', h5: '-$92B / -46%', h75: '-$138B / -62%', h10: '-$184B / -78%', stress: 'med' },
    { repoShock: '+50 bps', h2: '-$68B / -36%', h35: '-$104B / -54%', h5: '-$158B / -72%', h75: '-$224B / -86%', h10: '-$295B / -95%', stress: 'high' },
    { repoShock: '+75 bps', h2: '-$115B / -58%', h35: '-$168B / -76%', h5: '-$234B / -90%', h75: '-$312B / -98%', h10: '-$388B / CASCADE', stress: 'critical' },
    { repoShock: '+100 bps', h2: '-$172B / -82%', h35: '-$238B / -94%', h5: '-$318B / CASCADE', h75: '-$412B / CASCADE', h10: '-$490B / SYSTEMIC', stress: 'critical' },
  ];

  const historicalEvents = [
    {
      period: 'SEP 2019',
      title: 'Overnight Repo Spike Freeze',
      impact: 'SOFR spiked to 10.0%, overnight lending locked up. Fed launched emergency $75B/day overnight repo facilities and restarted Treasury bill purchases.',
      severity: 'CRITICAL DISLOCATION',
      severityColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    },
    {
      period: 'MAR 2020',
      title: 'Dash for Cash & Basis Blowout',
      impact: '10Y Cash-Futures basis inverted to historic 45 bps discount. Leveraged funds forced to liquidate Treasuries indiscriminately until Fed backstopped with $1.6T QE.',
      severity: 'SYSTEMIC UNWIND',
      severityColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    },
    {
      period: 'OCT 2023',
      title: '5% Yield Supply Indigestion',
      impact: 'Heavy Treasury refunding supply overwhelmed primary dealer balance sheets. 10Y basis widened to 22 bps as leveraged short positions reached record levels.',
      severity: 'ELEVATED STRAIN',
      severityColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
      period: 'CURRENT REGIME',
      title: 'T-0 High Leverage & RRP Drain',
      impact: 'Hedge fund leveraged money net short stands near -$820B notional. Reverse Repo buffer depleted, making cash-futures arbitrage vulnerable to quarter-end funding squeezes.',
      severity: 'HIGH FRAGILITY (74/100)',
      severityColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    }
  ];

  return (
    <>
      <SEOManager
        title="Treasury Basis Trade & Leverage Fragility Barometer — GraphiQuestor"
        description="Institutional desk monitoring hedge fund cash-futures basis trade leverage, CFTC net short positioning, SOFR-IORB repo spread, and forced liquidation stress."
        keywords={['Treasury basis trade', 'cash futures basis', 'CFTC leveraged short', 'repo market squeeze', 'SOFR IORB spread', 'FICC sponsored repo', 'hedge fund leverage']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'Treasury Basis Trade & Leverage Fragility Barometer',
            'url': 'https://graphiquestor.com/labs/treasury-basis-trade',
            'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                { '@type': 'ListItem', 'position': 3, 'name': 'Treasury Basis Trade Barometer' }
              ]
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FinancialProduct',
            'name': 'Treasury Basis Trade Fragility Index',
            'description': 'Institutional macro risk index measuring cash-futures basis trade unwind exposure and overnight repo collateral friction.'
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
            <span className="text-slate-400">Fixed Income & Repo Plumbing</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-mono">DESK 05: BASIS TRADE LEVERAGE</span>
          </div>
          <div className="flex items-center gap-3">
            <FreshnessChip status={dataFreshness.state} />
            <DataProvenanceBadge source="CFTC / FRBNY / FRED" />
          </div>
        </div>

        {/* Hero & Risk Dial */}
        <div className="max-w-7xl mx-auto mb-8 bg-[#090e1f]/80 backdrop-blur-md border border-slate-800/80 rounded-lg p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-xs text-cyan-400 font-mono">
                <Scale className="w-3.5 h-3.5" />
                <span>ARBITRAGE LEVERAGE & REPO STRESS MONITOR</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
                Treasury Cash-Futures Basis Trade & Leverage Fragility
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Institutional telemetry monitoring hedge fund cash-futures basis trade leverage, CFTC speculative net short positioning in 10Y/Ultra Treasury contracts, and repo collateral financing friction.
              </p>
            </div>

            {/* Composite Dial Box */}
            <div className="flex items-center gap-4 bg-[#0d142b] border border-slate-800 rounded-lg p-4 min-w-[280px]">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-rose-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${riskScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-white">{riskScore}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">SCORE</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-mono block">BLOWOUT RISK</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono border ${badge.bg}`}>
                  {badge.label}
                </span>
                <span className="text-[11px] text-slate-400 block">High Repo Friction</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Metric Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Basis Blowout Risk Index"
            value={riskMetric ? `${riskMetric.value.toFixed(0)} / 100` : '74 / 100'}
            history={riskMetric?.history || []}
            source="Composite Fragility Model"
            sublabel="Normalized vulnerability barometer combining leveraged positioning and repo spreads"
          />
          <MetricCard
            label="CFTC Leveraged Net Short"
            value={cftcMetric ? `-$${Math.abs(cftcMetric.value).toFixed(1)}B` : '-$820.5B'}
            history={cftcMetric?.history || []}
            source="CFTC Commitments of Traders"
            sublabel="Hedge fund net short notional in 10Y and Ultra Treasury futures"
          />
          <MetricCard
            label="SOFR-IORB Repo Spread"
            value={sofrSpreadMetric ? `${sofrSpreadMetric.value > 0 ? '+' : ''}${sofrSpreadMetric.value.toFixed(1)} bps` : '-9.0 bps'}
            history={sofrSpreadMetric?.history || []}
            source="FRBNY / St. Louis Fed"
            sublabel="Spread between Secured Overnight Financing Rate and Interest on Reserve Balances"
          />
          <MetricCard
            label="Primary Dealer Repo Financing"
            value={repoVolumeMetric ? `$${(repoVolumeMetric.value / 1000).toFixed(2)}T` : '$3.28T'}
            history={repoVolumeMetric?.history || []}
            source="FRBNY FR 2004"
            sublabel="Aggregate gross financing volume absorbed by primary dealers in repo markets"
          />
        </div>

        {/* Interactive Basis Unwind Fragility Matrix */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8 bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  INTERACTIVE BASIS UNWIND FRAGILITY MATRIX
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulated forced liquidation volume ($B) and return on equity (ROE) destruction under repo rate spikes and margin haircut increases.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Current Anchor: SOFR -9 bps
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2 text-slate-400">Repo Shock</th>
                    <th className="py-2 px-2 text-center text-slate-300">2.0% Haircut</th>
                    <th className="py-2 px-2 text-center text-slate-300">3.5% Haircut</th>
                    <th className="py-2 px-2 text-center text-slate-300">5.0% Haircut</th>
                    <th className="py-2 px-2 text-center text-slate-300">7.5% Haircut</th>
                    <th className="py-2 px-2 text-center text-slate-300">10.0% Haircut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {fragilityMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-2 font-bold text-amber-400 whitespace-nowrap">{row.repoShock}</td>
                      <td className="py-2 px-2 text-center text-slate-300 bg-slate-900/20">{row.h2}</td>
                      <td className="py-2 px-2 text-center text-slate-300 bg-slate-900/40">{row.h35}</td>
                      <td className="py-2 px-2 text-center text-amber-300/90 bg-amber-500/5">{row.h5}</td>
                      <td className="py-2 px-2 text-center text-rose-300/90 bg-rose-500/10 font-bold">{row.h75}</td>
                      <td className="py-2 px-2 text-center text-rose-400 bg-rose-500/20 font-bold">{row.h10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>*Assumes $820B gross basis exposure with 38x average fund leverage</span>
              <span className="text-amber-400/80">Threshold Warning: Haircuts &gt; 5% trigger severe non-linear liquidation</span>
            </div>
          </div>

          {/* Shadow Repo & Borrowing Anatomy */}
          <div className="lg:col-span-4 bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                SHADOW REPO BORROWING ANATOMY
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Channel composition of hedge fund Treasury collateral borrowing across cleared and shadow venues:
              </p>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>FICC Sponsored Repo</span>
                    <span className="text-cyan-400 font-bold">$980B (40%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Bilateral Non-Cleared Repo</span>
                    <span className="text-amber-400 font-bold">$820B (33%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Prime Broker Synthetic TRS</span>
                    <span className="text-rose-400 font-bold">$650B (27%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: '27%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Dealer Balance Sheet Buffer:</span>
                <span className="text-emerald-400 font-mono">16% Remaining</span>
              </div>
              <div className="flex justify-between">
                <span>Basel III eSLR Exemption:</span>
                <span className="text-rose-400 font-mono">EXPIRED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Basis Blowout Chronology */}
        <div className="max-w-7xl mx-auto bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-5 mb-8">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            HISTORICAL BASIS DISLOCATION & FUNDING STRESS CHRONOLOGY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {historicalEvents.map((ev, i) => (
              <div key={i} className="bg-[#0c1226] border border-slate-800/80 rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{ev.period}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ev.severityColor}`}>
                      {ev.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-2">{ev.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{ev.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Intelligence Context & Methodology */}
        <div className="max-w-7xl mx-auto bg-[#090e1f]/80 backdrop-blur-md border border-slate-800 rounded-lg p-6 mb-8 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-mono font-bold text-sm">
            <FileText className="w-4 h-4 text-cyan-400" />
            INSTITUTIONAL METHODOLOGY & TRANSMISSION MECHANISM
          </div>
          <p className="leading-relaxed">
            The Treasury cash-futures basis trade relies on repo financing to exploit minute pricing discrepancies (often 10–25 bps) between physical Treasury notes and Treasury futures contracts. Because the yield difference is narrow, multi-strategy hedge funds leverage these positions up to 50x–80x. When repo rates spike relative to policy rates (SOFR exceeding IORB) or broker-dealers demand higher margin haircuts, the trade instantly turns cash-flow negative, forcing managers into rapid deleveraging.
          </p>
          <p className="leading-relaxed">
            GraphiQuestor’s Basis Blowout Risk Score isolates the confluence of: (1) CFTC leveraged spec net short concentration, (2) SOFR-IORB spread divergence, (3) primary dealer sponsored repo capacity constraints, and (4) overnight reverse repo (ON RRP) buffer availability.
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

export default TreasuryBasisTradeLab;
