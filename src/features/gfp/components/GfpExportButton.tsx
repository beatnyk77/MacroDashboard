import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useGfpNetCost } from '@/hooks/useGfpNetCost';
import { useGfpMtsOutlays } from '@/hooks/useGfpMtsOutlays';
import { toCsv, downloadBlob } from '@/features/gfp/lib/exportSeries';

type Dataset = 'net-cost' | 'outlay-rank';
type Format = 'csv' | 'json';

export const GfpExportButton: React.FC = () => {
  const netCost = useGfpNetCost();
  const outlays = useGfpMtsOutlays();
  const [dataset, setDataset] = useState<Dataset>('net-cost');
  const [format, setFormat] = useState<Format>('csv');

  const rows: Record<string, unknown>[] =
    dataset === 'net-cost'
      ? ((netCost.data ?? []) as unknown as Record<string, unknown>[])
      : ((outlays.data?.rank ?? []) as unknown as Record<string, unknown>[]);

  const busy = dataset === 'net-cost' ? netCost.isLoading : outlays.isLoading;
  const disabled = busy || !rows.length;

  const onExport = () => {
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const base = dataset === 'net-cost' ? 'gfp-net-cost' : 'gfp-outlay-rank';
    if (format === 'csv') {
      downloadBlob(`${base}-${stamp}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    } else {
      downloadBlob(
        `${base}-${stamp}.json`,
        JSON.stringify(rows, null, 2),
        'application/json;charset=utf-8',
      );
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
        Export
      </span>
      <select
        value={dataset}
        onChange={(e) => setDataset(e.target.value as Dataset)}
        className="text-[10px] uppercase tracking-wider bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80"
      >
        <option value="net-cost">Net cost (accrual)</option>
        <option value="outlay-rank">Outlay rank (cash)</option>
      </select>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as Format)}
        className="text-[10px] uppercase tracking-wider bg-black/40 border border-white/10 rounded px-2 py-1 text-white/80"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <button
        type="button"
        disabled={disabled}
        onClick={onExport}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Download size={12} />
        {busy ? 'Loading…' : 'Download'}
      </button>
    </div>
  );
};
