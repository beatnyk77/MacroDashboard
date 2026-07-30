import React from 'react';
import { ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import {
  GfpBasisBadge,
  GfpKpiStrip,
  GfpInsightList,
  NetCostByAgencyChart,
  ConcentrationPanel,
  BalanceSheetTrendChart,
  AccrualBridgeTables,
  AgencyOutlaysRankTable,
  AgencyOutlaysSeriesChart,
  ReceiptsByAgencyPanel,
  GfpExportButton,
  GfpProvenanceFooter,
} from '@/features/gfp/components';
import { GFP_BASIS } from '@/features/gfp/lib/types';

export const GovFinancialPositionLab: React.FC = () => {
  return (
    <>
      <SEOManager
        title="Government Financial Position — FRUSG Net Cost, Balance Sheet & Agency Outlays"
        description="Institutional board for U.S. government GAAP net cost by agency, consolidated balance sheet, and monthly Treasury outlays by agency (MTS Table 5)."
        keywords={['FRUSG', 'Statement of Net Cost', 'US balance sheet', 'agency outlays', 'fiscal data']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Government Financial Position',
            description:
              'Institutional board for U.S. government GAAP net cost by agency, consolidated balance sheet, and monthly Treasury outlays by agency.',
            url: 'https://graphiquestor.com/labs/gov-financial-position',
            isPartOf: { '@id': 'https://graphiquestor.com/#website' },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://graphiquestor.com/' },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'US Macro & Fiscal Lab',
                  item: 'https://graphiquestor.com/labs/us-macro-fiscal',
                },
                { '@type': 'ListItem', position: 3, name: 'Government Financial Position' },
              ],
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'U.S. Government Financial Position (FRUSG + MTS)',
            description:
              'FRUSG Statement of Net Cost, consolidated balance sheet, and MTS Table 5 agency outlays from U.S. Treasury Fiscal Data.',
            url: 'https://graphiquestor.com/labs/gov-financial-position',
            isAccessibleForFree: true,
            creator: { '@type': 'Organization', name: 'GraphiQuestor' },
          },
        ]}
      />
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-16">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <ChevronRight size={10} />
            <a href="/labs/us-macro-fiscal" className="hover:text-white transition-colors">
              US Macro & Fiscal
            </a>
            <ChevronRight size={10} />
            <span className="text-cyan-500">Government Financial Position</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <ShieldAlert size={12} /> Dual-Basis Fiscal Board
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Government Financial <span className="text-cyan-500">Position</span>
          </h1>
          <p className="text-muted-foreground/60 max-w-3xl text-base md:text-lg font-medium leading-relaxed uppercase tracking-wide">
            FRUSG accrual net cost & consolidated balance sheet · MTS agency outlays (cash) — structural
            telemetry, not forecasts.
          </p>

          {/* Dual-basis callout */}
          <div className="mt-8 p-5 rounded-2xl border border-white/5 bg-white/[0.02] max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <GfpBasisBadge basis="accrual" />
              <GfpBasisBadge basis="cash" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Do not mix bases without explicit labeling
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              <span className="text-cyan-400/80 font-semibold">Accrual / GAAP</span> panels use the Financial
              Report of the U.S. Government ({GFP_BASIS.accrual.split('(')[0].trim()}).{' '}
              <span className="text-amber-400/80 font-semibold">Cash / budget</span> panels use Monthly
              Treasury Statement agency series. Net cost (accrual) is not comparable 1:1 to outlays (cash).
            </p>
          </div>
        </div>

        <SectionErrorBoundary name="GFP KPI Strip">
          <GfpKpiStrip />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="GFP Insights">
          <GfpInsightList />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Net Cost by Agency">
          <NetCostByAgencyChart />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Net Cost Concentration">
          <ConcentrationPanel />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Balance Sheet Trend">
          <BalanceSheetTrendChart />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Accrual Bridges">
          <AccrualBridgeTables />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Agency Outlays Rank">
          <AgencyOutlaysRankTable />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Agency Outlays Series">
          <AgencyOutlaysSeriesChart />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="Receipts by Agency">
          <ReceiptsByAgencyPanel />
        </SectionErrorBoundary>

        <div className="flex justify-end">
          <GfpExportButton />
        </div>

        <GfpProvenanceFooter />

        <div className="pt-12 border-t border-white/5 text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground/40 font-black uppercase tracking-widest hover:text-white"
            asChild
          >
            <a href="/labs/us-macro-fiscal" className="flex items-center gap-2">
              <ArrowLeft size={18} /> Back to US Macro & Fiscal Lab
            </a>
          </Button>
        </div>
        <RelatedContent />
        <RelatedMetrics />
      </div>
    </>
  );
};
