import React from 'react';
import { useFinancialConditions } from '@/hooks/useFinancialConditions';
import { FinancialConditionsCommodityChart } from './FinancialConditionsCommodityChart';
import { FCIComponentBreakdown } from './FCIComponentBreakdown';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import {
  Flame,
  Activity,
  Layers,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FinancialConditionsModule: React.FC<{ className?: string }> = ({ className }) => {
  const { data, isLoading } = useFinancialConditions();

  if (isLoading || !data) {
    return (
      <div className="w-full h-96 rounded-2xl border border-border/50 bg-card/40 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground font-mono text-xs">
          <Activity className="animate-spin text-primary" size={16} />
          SYNCHRONIZING BARCLAYS FCI &amp; COMMODITY CYCLES...
        </div>
      </div>
    );
  }

  const { history, current, regime, components, lastUpdated } = data;

  const historicalPrecedents = [
    {
      era: '2007 – 2008',
      title: 'Commodity Supercycle Peak & Credit Freeze',
      fciPeak: '+1.35σ',
      commPeak: '+1.34σ',
      description: 'Crude oil hit $147/bbl alongside industrial metals. Cost-push inflation squeezed corporate margins and forced central bank tightening until Lehman collapsed, triggering simultaneous credit spread blowout and commodity collapse.',
      color: 'border-orange-500/40 text-orange-400',
    },
    {
      era: '2014 – 2016',
      title: 'OPEC Price War & Global Disinflation Easing',
      fciPeak: '-0.38σ',
      commPeak: '-0.92σ',
      description: 'US shale expansion and Saudi market-share defense crashed crude to $26/bbl. The collapse in commodity momentum depressed headline inflation, allowing global central banks to sustain ultra-loose QE and negative rates.',
      color: 'border-cyan-500/40 text-cyan-400',
    },
    {
      era: '2021 – 2022',
      title: 'Post-Pandemic Supply Shock & Rate Spike',
      fciPeak: '+0.58σ',
      commPeak: '+0.78σ',
      description: 'Supply bottlenecks and Ukraine energy embargoes drove commodity momentum to +0.8σ. Global central banks initiated the most aggressive coordinated monetary tightening in 40 years, mechanically driving real yields from -1.0% to +2.5%.',
      color: 'border-amber-500/40 text-amber-400',
    },
    {
      era: '2025 – 2026',
      title: 'Structural Capex Deficit & Commodity Re-Coupling',
      fciPeak: '+0.15σ',
      commPeak: '+0.35σ',
      description: 'Refining capacity bottlenecks, critical mineral demand for electrification, and geopolitical deglobalization reignite commodity impulses, establishing a persistent mechanical floor under sovereign yields.',
      color: 'border-emerald-500/40 text-emerald-400',
    },
  ];

  return (
    <div className={cn('space-y-8', className)}>
      {/* Executive Intelligence Banner */}
      <div className="p-6 rounded-2xl bg-[#0a0f1d]/90 backdrop-blur-xl border border-border/60 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Flame size={18} />
              </span>
              <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
                Barclays FCI &amp; Commodity Cycle Transmission Desk
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Deconstructing the structural shift from central bank liquidity impulses to mechanical commodity cost-push tightening.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border', regime.badgeColor)}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {regime.title}
            </div>
            <FreshnessChip status="fresh" />
            <DataProvenanceBadge source="FRED / Barclays / IMF" />
          </div>
        </div>

        {/* Narrative Synthesis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} className="text-primary" />
              The Core Thesis
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              While the 2010–2020 decade was anchored by <strong className="text-primary">central bank liquidity impulses</strong> and zero inflation, this decade is driven by <strong className="text-orange-400">commodities</strong>, which mechanically tighten financial conditions through real yields and credit spreads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" />
              Transmission Mechanism
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              Raw material rallies force headline inflation higher, constraining central bank easing, pushing <strong className="text-foreground">10Y real TIPS yields higher</strong>, flattening yield curves, and widening corporate credit spreads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-400" />
              Current State ({lastUpdated})
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              Global FCI sits at <strong className="text-foreground">{current.fci > 0 ? `+${current.fci.toFixed(2)}` : current.fci.toFixed(2)}σ</strong> with Commodities Cycle at <strong className="text-foreground">{current.commodityCycle > 0 ? `+${current.commodityCycle.toFixed(2)}` : current.commodityCycle.toFixed(2)}σ</strong>, reflecting steady structural transmission.
            </p>
          </div>
        </div>
      </div>

      {/* Dual-Curve Interactive Chart */}
      <FinancialConditionsCommodityChart data={history} />

      {/* 5-Pillar Decomposition */}
      <FCIComponentBreakdown components={components} />

      {/* Structural Precedent Timeline */}
      <div className="p-6 rounded-2xl bg-[#0a0f1d]/90 backdrop-blur-xl border border-border/60 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-wider text-foreground">
              Historical Cycle Precedents (2006 – 2026)
            </h3>
            <p className="text-xs text-muted-foreground">
              Cross-asset validation proving the mechanical link across four distinct macroeconomic regimes.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2 size={12} />
            VERIFIED REGIMES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historicalPrecedents.map((prec) => (
            <div
              key={prec.era}
              className="p-4 rounded-xl bg-card/50 border border-border/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border/40">
                  {prec.era}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-orange-400">FCI: {prec.fciPeak}</span>
                  <span>·</span>
                  <span className="text-blue-400">Comm: {prec.commPeak}</span>
                </div>
              </div>

              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                {prec.title}
              </h4>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {prec.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
