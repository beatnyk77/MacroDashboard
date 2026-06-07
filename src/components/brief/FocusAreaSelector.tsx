import React, { useEffect } from 'react';
import type { FocusArea } from '@/types/brief';
import { FOCUS_AREA_LABELS } from '@/types/brief';

const STORAGE_KEY = 'gq_focus_areas';
const DEFAULT_AREAS: FocusArea[] = ['india', 'us_macro', 'gold_dedollarization'];

interface FocusAreaSelectorProps {
  selected: FocusArea[];
  onChange: (areas: FocusArea[]) => void;
}

export const FocusAreaSelector: React.FC<FocusAreaSelectorProps> = ({
  selected,
  onChange,
}) => {
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validAreas = parsed.filter((area) =>
            Object.keys(FOCUS_AREA_LABELS).includes(area)
          ) as FocusArea[];
          if (validAreas.length > 0) {
            onChange(validAreas);
            return;
          }
        }
      }
    } catch {
      // Ignore errors, fallback to default
    }
    onChange(DEFAULT_AREAS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (area: FocusArea) => {
    let next: FocusArea[];
    if (selected.includes(area)) {
      next = selected.filter((a) => a !== area);
    } else {
      if (selected.length < 3) {
        next = [...selected, area];
      } else {
        // Sliding window: remove oldest (first element) and append new
        next = [...selected.slice(1), area];
      }
    }
    onChange(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      {(Object.keys(FOCUS_AREA_LABELS) as FocusArea[]).map((area) => {
        const isSelected = selected.includes(area);
        const label = FOCUS_AREA_LABELS[area];

        return (
          <button
            key={area}
            onClick={() => handleToggle(area)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200',
              isSelected
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 bg-white/[0.01]',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
