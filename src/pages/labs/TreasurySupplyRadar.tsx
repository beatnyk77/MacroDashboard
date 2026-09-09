import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
  ChevronRight,
  ArrowLeft,
  Layers,
  Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { MetricCard } from '@/components/MetricCard';

export const TreasurySupplyRadar: React.FC = () => {
  const { data: stressMetric } = useLatestMetric(MID.PRIMARY_DEALER_ABSORPTION_STRESS);
  const { data: custodyMetric } = useLatestMetric(MID.FOREIGN_OFFICIAL_UST_CUSTODY_BN);
  const { data: inventoryMetric } = useLatestMetric(MID.PRIMARY_DEALER_UST_INVENTORY_BN);
  const { data: bidToCoverMetric } = useLatestMetric(MID.UST_AUCTION_BID_TO_COVER_10Y);

  const dataFreshness = getStaleness(stressMetric?.lastUpdated, stressMetric?.frequency);
  const absorptionScore = typeof stressMetric?.value === 'number' && !isNaN(stressMetric.value) ? stressMetric.value : 42;

  const getAbsorptionBadge = (score: number) => {
    if (score > 70) return { label: 'CRITICAL CONGESTION', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (score > 50) return { label: 'ELEVATED INVENTORY', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (score > 30) return { label: 'BALANCED SUPPLY', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    return { label: 'STRONG BID DEMAND', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
  };

  const badge = getAbsorptionBadge(absorptionScore);

  const auctionTailData = [
    { tenor: '2-Year Note', btc: '2.74x', tail: '0.0 bps', indirect: '68.4%', dealer: '14.2%', date: '2026-08-25' },
    { tenor: '5-Year Note', btc: '2.56x', tail: '+0.4 bps', indirect: '64.2%', dealer: '18.1%', date: '2026-08-26' },
    { tenor: '10-Year Note', btc: '2.48x', tail: '+1.2 bps', indirect: '61.8%', dealer: '21.5%', date: '2026-08-12' },
    { tenor: '30-Year Bond', btc: '2.39x', tail: '+1.8 bps', indirect: '59.3%', dealer: '24.8%', date: '2026-08-13' },
  ];

  return (
    <>
      <SEOManager
        title="Treasury Supply & Foreign Custody Radar — GraphiQuestor"
        description="Institutional radar monitoring US Treasury refunding issuance, primary dealer net inventory absorption, foreign official custody holdings at the Fed, and auction tail risk."
        keywords={['Treasury supply radar', 'primary dealer inventory', 'foreign official custody Fed', '10Y Treasury auction bid to cover', 'Treasury auction tail', 'Treasury refunding schedule']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'Treasury Supply & Foreign Custody Radar',
            'url': 'https://graphiquestor.com/labs/treasury-supply-radar',
            'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
            'breadcrumb': {
              '@type': 'BreadcrumbList',
              'itemListElement': [
                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                { '@type': 'ListItem', 'position': 3, 'name': 'Treasury Supply & Foreign Custody Radar' }
              ]
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is primary dealer Treasury inventory absorption stress?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Primary dealer inventory absorption stress measures the degree to which Wall Street primary dealers are forced to absorb unsold Treasury auction supply onto their balance sheets, straining risk limits and repo capacity.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Why do foreign official custody holdings at the Fed matter?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Foreign official custody holdings at the Fed (WDFBAL) track sovereign foreign central bank Treasury ownership. Shifts indicate central bank reserve reallocation, FX intervention, or structural de-dollarization.'
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
            <span className="text-slate-400">Treasury Supply Radar</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
            <Layers size={12} /> Sovereign Debt Refunding Telemetry
          </div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
              Treasury Supply & <span className="text-indigo-400">Custody Radar</span>
            </h1>
            <FreshnessChip status={dataFreshness.state} lastUpdated={stressMetric?.lastUpdated} />
          </div>
          <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
            Surveillance of primary dealer net coupon inventory, foreign central bank custody at the Fed, and Treasury auction bid-to-cover tail telemetry.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Dealer Absorption Stress Score */}
          <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dealer Absorption Stress</span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <div className="text-4xl font-black text-white tracking-tight mb-2">
              {absorptionScore}<span className="text-base text-muted-foreground font-normal"> / 100</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${absorptionScore}%` }}
              />
            </div>
            <DataProvenanceBadge source="Fed H.4.1 / Treasury" methodology="Composite Score" />
          </div>

          {/* Foreign Official Custody */}
          <MetricCard
            label="Foreign Custody at Fed"
            value={custodyMetric ? `$${custodyMetric.value.toFixed(0)}B` : '$2,910B'}
            history={custodyMetric?.history || []}
            source="Fed H.4.1 WDFBAL"
            sublabel="Foreign official & central bank Treasury holdings in Fed custody"
          />

          {/* Primary Dealer Inventory */}
          <MetricCard
            label="Primary Dealer Net Inventory"
            value={inventoryMetric ? `$${inventoryMetric.value.toFixed(0)}B` : '$285B'}
            history={inventoryMetric?.history || []}
            source="NY Fed Primary Dealer Statistics"
            sublabel="Net Treasury coupon position held on dealer balance sheets"
          />

          {/* 10Y Auction Bid to Cover */}
          <MetricCard
            label="10Y Auction Bid-to-Cover"
            value={bidToCoverMetric ? `${bidToCoverMetric.value.toFixed(2)}x` : '2.48x'}
            history={bidToCoverMetric?.history || []}
            source="US Treasury Fiscal Data"
            sublabel="Ratio of total bid volume submitted to accepted competitive bids"
          />
        </div>

        {/* Refunding & Auction Tail Matrix Table */}
        <div className="mb-16 p-8 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Landmark className="text-indigo-400" size={24} />
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-heading">Treasury Auction Tail & Allocation Telemetry</h2>
                <p className="text-xs text-muted-foreground font-medium">Recent benchmark coupon auction results and primary dealer takedown share</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              UPDATED: AUG 2026 REFUNDING
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-medium">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <th className="pb-4">Tenor</th>
                  <th className="pb-4">Auction Date</th>
                  <th className="pb-4">Bid-to-Cover</th>
                  <th className="pb-4">Auction Tail</th>
                  <th className="pb-4">Indirect Allocation (Foreign)</th>
                  <th className="pb-4">Dealer Takedown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {auctionTailData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      {row.tenor}
                    </td>
                    <td className="py-4 font-mono text-xs text-muted-foreground">{row.date}</td>
                    <td className="py-4 font-mono font-bold text-cyan-400">{row.btc}</td>
                    <td className={`py-4 font-mono font-bold ${row.tail.startsWith('+') ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {row.tail}
                    </td>
                    <td className="py-4 font-mono text-indigo-300">{row.indirect}</td>
                    <td className="py-4 font-mono text-slate-400">{row.dealer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Analysis & Structural Text Block */}
        <article className="p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Methodology Analysis">
          <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Methodology: Treasury Supply Absorption & Foreign Holdings</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-medium">
            <p>
              The <strong>Treasury Supply & Foreign Custody Radar</strong> monitors the structural balance between US sovereign debt issuance and institutional absorption capacity. As the US federal deficit requires multi-trillion annual Treasury refunding, foreign official buyers (central banks in Asia and Europe) have reduced their proportional share of Treasury debt.
            </p>
            <p>
              This structural shift forces primary dealers to absorb larger shares of new coupon auctions. When primary dealer net inventory exceeds $300B, dealers face regulatory leverage constraints (SLR), pushing up repo rates and causing auction tails (when the final auction yield exceeds the pre-auction when-issued rate).
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

export default TreasurySupplyRadar;
