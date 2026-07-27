// src/features/regime-digest/lib/buildWatchlist.ts
import type { MetricMove, WatchItem } from './types';

export function buildLevelWatchlist(movers: {
  up: MetricMove[];
  down: MetricMove[];
}): WatchItem[] {
  const items: WatchItem[] = [];
  for (const m of movers.up.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} follow-through`,
      why: `Largest upside MoM move (+${m.deltaPct.toFixed(1)}%); watch whether level holds above ${m.level}.`,
    });
  }
  for (const m of movers.down.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} stabilization`,
      why: `Largest downside MoM move (${m.deltaPct.toFixed(1)}%); watch for base-building near ${m.level}.`,
    });
  }
  return items.slice(0, 8);
}
