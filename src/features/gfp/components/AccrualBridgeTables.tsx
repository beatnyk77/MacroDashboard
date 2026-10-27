import React, { useMemo } from 'react';
import { useGfpBridges } from '@/hooks/useGfpBridges';
import { formatBillions } from '@/features/gfp/lib/format';
import { GFP_BASIS } from '@/features/gfp/lib/types';
import { GfpBasisBadge, GfpLoadingState, GfpUnavailableState } from './GfpEmptyState';

function latestFyRows<T extends { stmt_fiscal_year: number }>(rows: T[]): T[] {
  if (!rows.length) return [];
  const fy = Math.max(...rows.map((r) => r.stmt_fiscal_year));
  return rows.filter((r) => r.stmt_fiscal_year === fy);
}

export const AccrualBridgeTables: React.FC = () => {
  const { data, isLoading, error } = useGfpBridges();

  const tables = useMemo(() => {
    if (!data) return null;
    const netPosition = latestFyRows(data.netPosition);
    const reconciliations = latestFyRows(data.reconciliations);
    const cashBalance = latestFyRows(data.cashBalance);
    if (!netPosition.length && !reconciliations.length && !cashBalance.length) return null;

    const fy =
      netPosition[0]?.stmt_fiscal_year ??
      reconciliations[0]?.stmt_fiscal_year ??
      cashBalance[0]?.stmt_fiscal_year ??
      null;

    return { fy, netPosition, reconciliations, cashBalance };
  }, [data]);

  if (isLoading) return <GfpLoadingState />;
  if (error || !tables) return <GfpUnavailableState />;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Accrual Bridge Tables
            {tables.fy != null ? ` · FY${tables.fy}` : ''}
          </h3>
          <p className="text-[11px] text-terminal-dim uppercase tracking-wider mt-1">
            Net position · Budget-to-accrual recon · Cash balance
          </p>
        </div>
        <GfpBasisBadge basis="accrual" />
      </div>
      <p className="text-[11px] text-terminal-dim">{GFP_BASIS.accrual}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <BridgeTable
          title="Net Position"
          empty={!tables.netPosition.length}
          headers={['Line', 'Consolidated $B']}
          rows={tables.netPosition.map((r) => [
            r.line_item_desc ?? r.account_desc ?? '—',
            formatBillions(r.consolidated_bil),
          ])}
        />
        <BridgeTable
          title="Reconciliation"
          empty={!tables.reconciliations.length}
          headers={['Line', 'Position $B']}
          rows={tables.reconciliations.map((r) => [
            r.line_item_desc ?? r.component_desc ?? r.account_desc ?? '—',
            formatBillions(r.position_bil),
          ])}
        />
        <BridgeTable
          title="Cash Balance"
          empty={!tables.cashBalance.length}
          headers={['Line', 'Position $B']}
          rows={tables.cashBalance.map((r) => [
            r.line_item_desc ?? r.component_desc ?? r.account_desc ?? '—',
            formatBillions(r.position_bil),
          ])}
        />
      </div>
    </section>
  );
};

const BridgeTable: React.FC<{
  title: string;
  headers: string[];
  rows: string[][];
  empty: boolean;
}> = ({ title, headers, rows, empty }) => (
  <div className="rounded-xl border border-border bg-white/[0.02] overflow-hidden flex flex-col max-h-80">
    <div className="px-3 py-2 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </div>
    {empty ? (
      <div className="p-4 text-[11px] text-terminal-dim">No rows for latest FY.</div>
    ) : (
      <div className="overflow-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-background/80 backdrop-blur">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 font-semibold uppercase tracking-wider text-terminal-dim text-[11px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-3 py-1.5 text-white/80 max-w-[14rem] truncate" title={row[0]}>
                  {row[0]}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-right text-white">
                  {row[1]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
