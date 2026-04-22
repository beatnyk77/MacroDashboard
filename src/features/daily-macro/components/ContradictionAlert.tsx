/**
 * ContradictionAlert
 * Renders 1–2 cross-market contradiction chips.
 * Phase 2 component; renders nothing if no contradictions yet (Phase 1 safe).
 */

import React, { useState } from 'react';
import type { Contradiction } from '../hooks/useContradictions';

interface ContradictionAlertProps {
  contradictions: Contradiction[];
}

export const ContradictionAlert: React.FC<ContradictionAlertProps> = ({
  contradictions,
}) => {
  if (contradictions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div
        className="text-[9px] font-black uppercase tracking-[0.35em]"
        style={{ color: 'rgba(251,191,36,0.6)' }}
      >
        Cross-Market Contradictions
      </div>
      {contradictions.map((c) => (
        <ContradictionChip key={c.contradiction_key} contradiction={c} />
      ))}
    </div>
  );
};

const ContradictionChip: React.FC<{ contradiction: Contradiction }> = ({
  contradiction,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isExtreme = contradiction.severity === 'EXTREME';

  return (
    <button
      onClick={() => setExpanded((p) => !p)}
      className="w-full text-left rounded-xl p-3.5 transition-all duration-200"
      style={{
        background: isExtreme
          ? 'rgba(251,191,36,0.07)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isExtreme ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isExtreme ? '0 0 20px rgba(251,191,36,0.06)' : 'none',
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
          style={{
            background: isExtreme ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
            color: isExtreme ? '#fbbf24' : 'rgba(255,255,255,0.4)',
          }}
        >
          {contradiction.severity}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[12px] font-bold leading-snug"
            style={{ color: isExtreme ? '#fbbf24' : 'rgba(255,255,255,0.75)' }}
          >
            {contradiction.title}
          </div>
        </div>
        <div
          className="text-[10px] text-white/30 flex-shrink-0 mt-0.5 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </div>
      </div>

      {/* Expanded interpretation */}
      {expanded && (
        <div
          className="mt-3 text-[11px] leading-relaxed"
          style={{
            color: 'rgba(255,255,255,0.5)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '0.625rem',
          }}
        >
          {contradiction.interpretation}
        </div>
      )}
    </button>
  );
};
