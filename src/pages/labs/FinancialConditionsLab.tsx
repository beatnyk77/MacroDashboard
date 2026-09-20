import React from 'react';
import { FinancialConditionsModule } from '@/features/financial-conditions/components/FinancialConditionsModule';
import { SEOManager } from '@/components/SEOManager';
import { TrailLink as Link } from '@/components/TrailLink';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { RelatedContent } from '@/components/RelatedContent';
import {
  Flame,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export const FinancialConditionsLab: React.FC = () => {
  return (
    <div className="w-full min-h-screen py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <SEOManager
        title="Financial Conditions & Commodity Cycle Observatory — Barclays Model"
        description="Institutional telemetry analyzing the mechanical transmission between the global commodity supercycle and global financial conditions (FCI) across credit spreads, real rates, and dollar liquidity."
        keywords={[
          'financial conditions index',
          'barclays fci',
          'commodity cycle',
          'real interest rates',
          'high yield oas',
          'cost push inflation',
          'macro liquidity',
          'graphiquestor'
        ]}
        isApp={true}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            'name': 'Financial Conditions & Commodity Cycle Observatory',
            'url': 'https://graphiquestor.com/labs/financial-conditions/',
            'description': 'Tracking the structural co-movement between global commodity cycles and financial conditions indices.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FinancialProduct',
            'name': 'Barclays Financial Conditions Index Model',
            'description': 'Standardized 5-pillar Z-score model of financial conditions.',
          }
        ]}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Link to="/labs/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            Thematic Labs
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">Financial Conditions &amp; Commodities</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
            <CheckCircle2 size={11} />
            INSTITUTIONAL TELEMETRY
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame size={24} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
              Financial Conditions &amp; Commodity Impulse Observatory
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mapping how structural raw material cycles mechanically tighten sovereign rates, credit spreads, and global dollar plumbing.
            </p>
          </div>
        </div>
      </div>

      {/* Core Interactive Module */}
      <FinancialConditionsModule />

      {/* Methodology & Analytical Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="p-5 rounded-xl border border-border bg-card/90 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            The Barclays FCI Formulation
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlike black-box principal component analysis (PCA), the <strong className="text-foreground">Barclays Financial Conditions Index</strong> uses
            an equal-weighted standardized formulation over 1-year changes (YoY delta) across five canonical macro transmission pillars:
          </p>
          <code className="block p-3 bg-muted/80 rounded-lg font-mono text-[11px] text-primary leading-relaxed border border-border/50 overflow-x-auto">
            FCI = ⅕ [ Z(Δ CS) + Z(Δ r10Y) − Z(Δ YC_Slope) + Z(Δ Broad_USD) − Z(Δ S&amp;P500) ]
          </code>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li><strong className="text-foreground">Credit Spreads (CS):</strong> ICE BofA US High Yield OAS (`BAMLH0A0HYM2`).</li>
            <li><strong className="text-foreground">Real 10Y Yield (r10Y):</strong> US 10-Year TIPS Yield (`DFII10`).</li>
            <li><strong className="text-foreground">Slope (YC):</strong> 10Y minus 2Y Constant Maturity (`T10Y2Y`). Inversion adds to tightening.</li>
            <li><strong className="text-foreground">Broad Dollar:</strong> Nominal Trade-Weighted Dollar (`DTWEXBGS`).</li>
            <li><strong className="text-foreground">Equities:</strong> S&amp;P 500 Daily Index (`SP500`). Drawdowns add to tightening.</li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card/90 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-400" />
            The Mechanical Commodity Feedback Loop
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            In a supply-constrained macro environment, <strong className="text-foreground">commodities are not merely an asset class — they are an exogenous policy constraint</strong>.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When energy, industrial metals, and agricultural indices surge, input costs cascade into headline Producer and Consumer Price Indices.
            This prohibits central banks from easing policy even as real growth slows, mechanically forcing real discount rates higher,
            compressing equity valuation multiples, and widening corporate refinancing costs.
          </p>
          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs text-orange-300 font-mono">
            <strong>Key Allocator Insight:</strong> When Commodities Cycle Z-score exceeds +0.5σ, duration risk elevates and risk premia widen regardless of central bank rhetoric.
          </div>
        </div>
      </div>

      {/* Related Lab Navigation */}
      <div className="pt-6 border-t border-border/40 space-y-4">
        <RelatedMetrics />
        <RelatedContent />
      </div>
    </div>
  );
};
