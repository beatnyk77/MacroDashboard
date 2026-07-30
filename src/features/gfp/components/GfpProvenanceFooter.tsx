import React, { useMemo } from 'react';
import { useGfpNetCost } from '@/hooks/useGfpNetCost';
import { useGfpBalanceSheet } from '@/hooks/useGfpBalanceSheet';
import { useGfpMtsOutlays } from '@/hooks/useGfpMtsOutlays';
import { useGfpReceipts } from '@/hooks/useGfpReceipts';
import { GFP_BASIS } from '@/features/gfp/lib/types';

const ENDPOINTS = [
  {
    label: 'Statement of Net Cost',
    path: 'v2/accounting/od/statement_net_cost',
    basis: 'accrual' as const,
  },
  {
    label: 'Balance Sheets',
    path: 'v2/accounting/od/balance_sheets',
    basis: 'accrual' as const,
  },
  {
    label: 'Net Position',
    path: 'v1/accounting/od/net_position',
    basis: 'accrual' as const,
  },
  {
    label: 'Reconciliations',
    path: 'v1/accounting/od/reconciliations',
    basis: 'accrual' as const,
  },
  {
    label: 'Cash Balance',
    path: 'v1/accounting/od/cash_balance',
    basis: 'accrual' as const,
  },
  {
    label: 'MTS Table 5 Outlays',
    path: 'v1/accounting/mts/mts_table_5',
    basis: 'cash' as const,
  },
  {
    label: 'Receipts by Department',
    path: 'v1/accounting/od/receipts_by_department',
    basis: 'cash' as const,
  },
];

function maxDate(dates: (string | undefined | null)[]): string | null {
  const valid = dates.filter((d): d is string => !!d && Number.isFinite(Date.parse(d)));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b));
}

export const GfpProvenanceFooter: React.FC = () => {
  const netCost = useGfpNetCost();
  const bs = useGfpBalanceSheet(false);
  const outlays = useGfpMtsOutlays();
  const receipts = useGfpReceipts();

  const asOf = useMemo(() => {
    const frusg = maxDate([
      ...(netCost.data ?? []).map((r) => r.record_date),
      ...(bs.data?.summary ?? []).map((r) => r.record_date),
    ]);
    const mts = maxDate((outlays.data?.rank ?? []).map((r) => r.record_date));
    const rec = maxDate((receipts.data ?? []).map((r) => r.record_date));
    return { frusg, mts, rec };
  }, [netCost.data, bs.data, outlays.data, receipts.data]);

  return (
    <footer className="space-y-3 p-4 rounded-xl border border-white/5 bg-black/20 text-[10px] text-muted-foreground/60">
      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
        Data Provenance · U.S. Treasury Fiscal Data API
      </div>
      <p className="leading-relaxed">
        Accrual series: {GFP_BASIS.accrual}. Cash series: {GFP_BASIS.cash}. Base host:{' '}
        <span className="font-mono text-white/50">https://api.fiscaldata.treasury.gov/services/api/fiscal_service/</span>
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {ENDPOINTS.map((ep) => (
          <li key={ep.path} className="flex gap-2">
            <span
              className={
                ep.basis === 'accrual' ? 'text-cyan-500/70' : 'text-amber-500/70'
              }
            >
              [{ep.basis}]
            </span>
            <span className="text-white/50">{ep.label}</span>
            <span className="font-mono text-muted-foreground/40 truncate">{ep.path}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-4 pt-1 border-t border-white/5 font-mono">
        <span>FRUSG last record_date: {asOf.frusg ?? '—'}</span>
        <span>MTS last record_date: {asOf.mts ?? '—'}</span>
        <span>Receipts last record_date: {asOf.rec ?? '—'}</span>
      </div>
      <p className="text-muted-foreground/40">
        Ingest: <span className="font-mono">ingest-gov-financial-position</span>. No forecasts —
        structural telemetry only.
      </p>
    </footer>
  );
};
