/**
 * ContradictionAlert
 * Renders 1–2 cross-market contradiction chips.
 * Phase 2 component; renders nothing if no contradictions yet (Phase 1 safe).
 */

import React, { useState } from 'react';
import type { Contradiction } from '../hooks/useContradictions';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

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
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: alpha(CHART_COLORS.gold, 0.6) }}
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
          ? alpha(CHART_COLORS.gold, 0.07)
          : WHITE_ALPHA.ghost,
        border: `1px solid ${isExtreme ? alpha(CHART_COLORS.gold, 0.25) : WHITE_ALPHA.line}`,
        boxShadow: isExtreme ? `0 0 20px ${alpha(CHART_COLORS.gold, 0.06)}` : 'none',
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 flex-shrink-0 text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded"
          style={{
            background: isExtreme ? alpha(CHART_COLORS.gold, 0.15) : WHITE_ALPHA.faint,
            color: isExtreme ? CHART_COLORS.gold : WHITE_ALPHA.dim,
          }}
        >
          {contradiction.severity}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[12px] font-bold leading-snug"
            style={{ color: isExtreme ? CHART_COLORS.gold : WHITE_ALPHA.strong }}
          >
            {contradiction.title}
          </div>
        </div>
        <div
          className="text-[11px] text-terminal-dim flex-shrink-0 mt-0.5 transition-transform duration-200"
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
            color: WHITE_ALPHA.mid,
            borderTop: `1px solid ${WHITE_ALPHA.faint}`,
            paddingTop: '0.625rem',
          }}
        >
          {contradiction.interpretation}
        </div>
      )}
    </button>
  );
};
