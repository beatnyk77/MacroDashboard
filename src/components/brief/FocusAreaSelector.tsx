import React from 'react';
import type { FocusAreaCode } from '@/hooks/useMacroBrief';

interface FocusArea {
  code: FocusAreaCode;
  label: string;
  emoji: string;
}

const FOCUS_AREAS: FocusArea[] = [
  { code: 'us',        label: 'US Macro',                emoji: '🇺🇸' },
  { code: 'india',     label: 'India',                   emoji: '🇮🇳' },
  { code: 'china',     label: 'China',                   emoji: '🇨🇳' },
  { code: 'africa',    label: 'Africa',                  emoji: '🌍' },
  { code: 'energy',    label: 'Energy',                  emoji: '⚡' },
  { code: 'sovereign', label: 'Sovereign Debt',          emoji: '🏦' },
  { code: 'gold',      label: 'Gold & De-Dollarization', emoji: '💛' },
  { code: 'trade',     label: 'Trade Flows',             emoji: '🔄' },
];

const MAX_SELECTIONS = 3;

interface FocusAreaSelectorProps {
  selected: FocusAreaCode[];
  onChange: (areas: FocusAreaCode[]) => void;
  open: boolean;
  onClose: () => void;
}

export const FocusAreaSelector: React.FC<FocusAreaSelectorProps> = ({
  selected,
  onChange,
  open,
  onClose,
}) => {
  if (!open) return null;

  const toggle = (code: FocusAreaCode) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, code]);
    }
    // Silent no-op if at max and trying to add
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Focus Areas <span className="text-white/20">({selected.length}/{MAX_SELECTIONS})</span>
        </span>
        <button
          onClick={onClose}
          className="text-[10px] font-black uppercase text-white/30 hover:text-white/60 transition-colors"
        >
          Done
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {FOCUS_AREAS.map((area) => {
          const isSelected = selected.includes(area.code);
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS;

          return (
            <button
              key={area.code}
              onClick={() => toggle(area.code)}
              data-selected={isSelected ? 'true' : 'false'}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-all',
                isSelected
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                  : isDisabled
                  ? 'bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80',
              ].join(' ')}
            >
              <span>{area.emoji}</span>
              <span className="leading-tight">{area.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[9px] text-white/20 text-center uppercase tracking-widest">
        Personalizes Section 3 of the brief. No login required.
      </p>
    </div>
  );
};
