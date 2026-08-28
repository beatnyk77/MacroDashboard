import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSovereignStressDesk, TICHoldingFlow } from '@/hooks/useSovereignStressDesk';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';

const DESK_TABS = [
  'TIC Flow & Dump Matrix',
  'Maturity Wall & Auctions',
  'Offshore Dollar Funding Stress',
] as const;

type DeskTab = typeof DESK_TABS[number];

export const SovereignStressDeskCard: React.FC = () => {
  const { data, isLoading } = useSovereignStressDesk();
  const [activeTab, setActiveTab] = useState<DeskTab>('TIC Flow & Dump Matrix');

  if (isLoading || !data) {
    return (
      <div className="w-full min-h-[400px] bg-slate-950/80 border border-slate-800 p-8 flex items-center justify-center font-mono text-xs text-slate-500 animate-pulse">
        LOADING SOVEREIGN STRESS & CAPITAL FLOWS TELEMETRY...
      </div>
    );
  }

  const { gauges, ticFlows, maturityConcentration, auctionMetrics, fundingStress } = data;

  return (
    <Card className="w-full bg-[#0c0e14] border border-slate-800/80 backdrop-blur-md rounded-none shadow-2xl overflow-hidden">
      {/* Top Header */}
      <CardHeader className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-none bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <CardTitle className="font-mono text-base md:text-lg font-bold text-slate-100 uppercase tracking-tight">
                Sovereign Stress & Cross-Border Capital Flows Desk
              </CardTitle>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              TIC foreign Treasury holdings, sovereign debt rollover walls, and offshore dollar funding stress
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-mono bg-slate-900/90 text-cyan-400 px-2.5 py-0.5 border border-cyan-900/40">
              TIC Release: Aug 2026
            </span>
            <MetricFreshnessChip staleness="fresh" customLabel="TREASURY LIVE" />
          </div>
        </div>

        {/* 4 Top Gauges Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-2">
          {/* Gauge 1 */}
          <div className="bg-slate-950/70 border border-slate-800/60 p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Foreign UST Holdings</div>
            <div className="font-mono text-lg font-bold text-slate-100 mt-0.5">
              ${gauges.totalForeignHoldingsTn.toFixed(2)}T
              <span className="text-xs font-normal text-emerald-400 ml-1.5">+{gauges.totalForeignYoYPct}% YoY</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Global Central Banks + Funds</div>
          </div>

          {/* Gauge 2 */}
          <div className="bg-slate-950/70 border border-rose-950/40 p-3">
            <div className="text-[10px] font-mono text-rose-300 uppercase">China (PBoC) Held</div>
            <div className="font-mono text-lg font-bold text-rose-400 mt-0.5">
              ${gauges.chinaHoldingsBn.toFixed(0)}B
              <span className="text-xs font-normal text-rose-500 ml-1.5">{gauges.china12mFlowBn.toFixed(0)}B / 12M</span>
            </div>
            <div className="text-[10px] font-mono text-rose-400/70 mt-1">Strategic De-Dollarization</div>
          </div>

          {/* Gauge 3 */}
          <div className="bg-slate-950/70 border border-amber-950/40 p-3">
            <div className="text-[10px] font-mono text-amber-300 uppercase">Japan (BoJ) Held</div>
            <div className="font-mono text-lg font-bold text-amber-400 mt-0.5">
              ${gauges.japanHoldingsBn.toFixed(0)}B
              <span className="text-xs font-normal text-amber-500 ml-1.5">{gauges.japan12mFlowBn.toFixed(0)}B / 12M</span>
            </div>
            <div className="text-[10px] font-mono text-amber-400/70 mt-1">Tactical FX Defense</div>
          </div>

          {/* Gauge 4 */}
          <div className="bg-slate-950/70 border border-cyan-950/40 p-3">
            <div className="text-[10px] font-mono text-cyan-300 uppercase">US 12M Rollover Wall</div>
            <div className="font-mono text-lg font-bold text-cyan-300 mt-0.5">
              ${gauges.usDebt12mRolloverTn.toFixed(2)}T
              <span className="text-xs font-normal text-slate-400 ml-1.5">{gauges.usDebt12mRolloverPct}% Total</span>
            </div>
            <div className="text-[10px] font-mono text-cyan-400/70 mt-1">Debt Maturing in &lt; 1 Year</div>
          </div>
        </div>

        {/* Desk View Switcher Tabs */}
        <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto no-scrollbar pt-1">
          {DESK_TABS.map((tab) => {
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

      {/* Main Panel Content */}
      <CardContent className="p-0">
        {activeTab === 'TIC Flow & Dump Matrix' && (
          <div className="divide-y divide-slate-800/50">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-950/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Sovereign Holder</div>
              <div className="col-span-2 text-right">Total UST Held</div>
              <div className="col-span-2 text-right">1M Net Flow</div>
              <div className="col-span-2 text-right">12M Net Flow</div>
              <div className="col-span-3 text-right">Primary Strategic Intent</div>
            </div>

            {/* Rows */}
            {ticFlows.map((flow) => (
              <TICRow key={flow.country} flow={flow} />
            ))}
          </div>
        )}

        {activeTab === 'Maturity Wall & Auctions' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {maturityConcentration.map((mat) => (
                <div key={mat.period} className="bg-slate-950/60 border border-slate-800/80 p-4">
                  <div className="text-xs font-mono text-slate-400 uppercase">{mat.period} Rollover Concentration</div>
                  <div className="font-mono text-2xl font-black text-cyan-300 mt-1">${mat.amountTn.toFixed(2)}T</div>
                  <div className="w-full h-1.5 bg-slate-900 mt-3 relative overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      style={{ width: `${Math.min(mat.pctOfTotalDebt * 3, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-2">{mat.pctOfTotalDebt}% of total marketable debt</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-800/60 p-4">
              <div>
                <div className="text-xs font-mono text-slate-300 uppercase">Auction Demand Gauge & Bid-to-Cover</div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="font-mono text-3xl font-black text-emerald-400">{auctionMetrics.bidToCover.toFixed(2)}x</div>
                  <div className="text-xs font-mono text-slate-400">Average Bid-to-Cover Ratio Across 2Y/5Y/10Y/30Y</div>
                </div>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Indirect Bidders (Foreign Central Banks):</span>
                  <span className="text-emerald-400 font-bold">{auctionMetrics.indirectBidderPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Dealer Absorption (Supply Digestion):</span>
                  <span className="text-cyan-400 font-bold">{auctionMetrics.primaryDealerPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Offshore Dollar Funding Stress' && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-600/40 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                <div className="font-mono text-sm font-bold text-emerald-300">{fundingStress.headline}</div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-800">
                STATUS: {fundingStress.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/70 border border-slate-800 p-4">
                <div className="text-xs font-mono text-slate-400 uppercase">Central Bank FX Swap Line Draws</div>
                <div className="font-mono text-2xl font-bold text-slate-100 mt-1">${fundingStress.swapLineDrawsBn}B</div>
                <p className="text-[11px] font-mono text-slate-400 mt-2">
                  USD borrowed by ECB, BoJ, SNB, and BoE through Federal Reserve liquidity swap lines.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4">
                <div className="text-xs font-mono text-slate-400 uppercase">SOFR-EFFR Spread (Repo Stress)</div>
                <div className="font-mono text-2xl font-bold text-slate-100 mt-1">+{fundingStress.sofrEffrSpreadBps} bps</div>
                <p className="text-[11px] font-mono text-slate-400 mt-2">
                  Secured Overnight Financing Rate vs Effective Fed Funds Rate spread.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">PROVENANCE:</span>
            <span>US Treasury TIC System, Federal Reserve Flow of Funds (Z.1), Bureau of the Fiscal Service.</span>
          </div>
          <DataProvenanceBadge
            sourceName="Treasury TIC & Fiscal Service"
            sourceUrl="https://ticdata.treasury.gov/"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const TICRow: React.FC<{ flow: TICHoldingFlow }> = ({ flow }) => {
  const is1mPositive = flow.flow1mBn >= 0;
  const is12mPositive = flow.flow12mBn >= 0;

  return (
    <div className="px-5 py-3.5 hover:bg-slate-900/40 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Sovereign Name */}
        <div className="col-span-3 flex items-center space-x-2.5">
          <span className="text-lg">{flow.flag}</span>
          <div>
            <div className="font-mono text-sm font-semibold text-slate-100">{flow.country}</div>
          </div>
        </div>

        {/* Total Held */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400 lg:hidden">Total Held:</span>
          <span className="font-mono text-sm font-bold text-slate-100">
            ${flow.totalHeldBn.toFixed(1)}B
          </span>
        </div>

        {/* 1M Flow */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400 lg:hidden">1M Flow:</span>
          <span
            className={`font-mono text-xs font-semibold ${
              is1mPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {is1mPositive ? '+' : ''}${flow.flow1mBn.toFixed(1)}B
          </span>
        </div>

        {/* 12M Flow */}
        <div className="col-span-2 lg:text-right flex lg:block justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400 lg:hidden">12M Flow:</span>
          <span
            className={`font-mono text-xs font-bold ${
              is12mPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {is12mPositive ? '+' : ''}${flow.flow12mBn.toFixed(1)}B
          </span>
        </div>

        {/* Primary Strategic Motivation */}
        <div className="col-span-3 lg:text-right flex lg:justify-end">
          <MotivationBadge motivation={flow.motivation} color={flow.motivationColor} />
        </div>
      </div>
    </div>
  );
};

const MotivationBadge: React.FC<{
  motivation: TICHoldingFlow['motivation'];
  color: TICHoldingFlow['motivationColor'];
}> = ({ motivation, color }) => {
  switch (color) {
    case 'rose':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/80">
          ⚡ {motivation}
        </span>
      );
    case 'amber':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/80">
          ⚠️ {motivation}
        </span>
      );
    case 'cyan':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-950/50 text-cyan-300 border border-cyan-800/50">
          🔄 {motivation}
        </span>
      );
    case 'emerald':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
          ▲ {motivation}
        </span>
      );
  }
};
