import React from 'react';

export const GfpLoadingState: React.FC = () => (
  <div className="text-xs text-muted-foreground uppercase tracking-widest p-6">Loading…</div>
);

export const GfpUnavailableState: React.FC<{ message?: string }> = ({
  message = 'Data unavailable. Run ingest-gov-financial-position.',
}) => (
  <div className="text-xs text-muted-foreground/60 p-6 border border-white/5 rounded-xl">
    {message}
  </div>
);

export const GfpBasisBadge: React.FC<{ basis: 'accrual' | 'cash' }> = ({ basis }) => (
  <span
    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
      basis === 'accrual'
        ? 'text-cyan-400/90 border-cyan-500/20 bg-cyan-500/5'
        : 'text-amber-400/90 border-amber-500/20 bg-amber-500/5'
    }`}
  >
    {basis === 'accrual' ? 'Accrual / GAAP' : 'Cash / Budget'}
  </span>
);
