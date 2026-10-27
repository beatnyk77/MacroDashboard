import React from 'react';
import { PublisherOrganizationSchema } from '@/config/brandConfig';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
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
import { LabPageHeader } from '@/components/LabPageHeader';
import { TrailLink } from '@/components/TrailLink';

export const GovFinancialPositionLab: React.FC = () => {
  return (
    <>
      <SEOManager
        title="MTS Table 5: Monthly Treasury Outlays by Agency"
        description="Monthly Treasury Statement (MTS) Table 5 outlays by agency from the Fiscal Data API, alongside FRUSG net cost and the consolidated U.S. balance sheet."
        keywords={['MTS Table 5', 'mts_table_5', 'Monthly Treasury Statement', 'fiscaldata API', 'agency outlays', 'FRUSG', 'Statement of Net Cost', 'US balance sheet']}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Government Financial Position',
            description:
              'Institutional board for U.S. government GAAP net cost by agency, consolidated balance sheet, and monthly Treasury outlays by agency.',
            url: 'https://graphiquestor.com/labs/gov-financial-position/',
            isPartOf: { '@id': 'https://graphiquestor.com/#website' },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://graphiquestor.com/' },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'US Macro & Fiscal Lab',
                  item: 'https://graphiquestor.com/labs/us-macro-fiscal/',
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
            url: 'https://graphiquestor.com/labs/gov-financial-position/',
            isAccessibleForFree: true,
            license: 'https://creativecommons.org/licenses/by/4.0/',
            creator: PublisherOrganizationSchema,
          },
        ]}
      />
      <div className="page-shell space-y-16">
        <LabPageHeader
          trail={[{ label: 'Home', to: '/' }, { label: 'US Macro & Fiscal', to: '/labs/us-macro-fiscal/' }]}
          current="Government Financial Position"
          badge="Dual-Basis Fiscal Board"
          badgeIcon={<ShieldAlert size={12} />}
          title={<>Government Financial <span className="text-blue-400">Position</span></>}
          thesis="FRUSG accrual net cost & consolidated balance sheet · MTS agency outlays (cash) — structural telemetry, not forecasts."
        >
          {/* Dual-basis callout */}
          <div className="mt-8 p-5 rounded-xl border border-border bg-white/[0.02] max-w-4xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <GfpBasisBadge basis="accrual" />
              <GfpBasisBadge basis="cash" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
                Do not mix bases without explicit labeling
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-cyan-400/80 font-semibold">Accrual panels:</span> Financial Report of the
              U.S. Government (GAAP).{' '}
              <span className="text-amber-400/80 font-semibold">Cash panels:</span> MTS Table 5 / Receipts by
              Department (budget basis). Do not mix bases without labels. Net cost (accrual) is not
              comparable 1:1 to outlays (cash).
            </p>
          </div>
        </LabPageHeader>

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

        <div className="pt-12 border-t border-border text-center">
          <Button
            variant="ghost"
            className="text-terminal-dim font-semibold uppercase tracking-wider hover:text-white"
            asChild
          >
            <TrailLink to="/labs/us-macro-fiscal/" className="flex items-center gap-2">
              <ArrowLeft size={18} /> Back to US Macro & Fiscal Lab
            </TrailLink>
          </Button>
        </div>
        <RelatedContent />
        <RelatedMetrics />
      </div>
    </>
  );
};
