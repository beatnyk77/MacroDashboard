// src/features/regime-digest/lib/computeMom.ts
import type { MetricDef, MetricMove, MetricRow } from './types';
import type { ValidatedObservation } from './validateMetric';

export function buildMetricRow(
  def: MetricDef,
  current: ValidatedObservation,
  prior: ValidatedObservation,
): MetricRow {
  const level = current.level;
  const priorLevel = prior.level;
  let delta: number | null = null;
  let deltaPct: number | null = null;
  if (level != null && priorLevel != null && priorLevel !== 0) {
    delta = level - priorLevel;
    deltaPct = (delta / priorLevel) * 100;
  } else if (level != null && priorLevel != null && priorLevel === 0) {
    delta = level - priorLevel;
    deltaPct = null;
  }

  // Prefer current validation status; if current ok but we only have withheld level, status stays
  const status = current.status;

  return {
    id: def.id,
    name: def.name,
    section: def.section,
    level: status === 'failed_validation' ? null : level,
    priorLevel: prior.status === 'failed_validation' ? null : priorLevel,
    delta: status === 'ok' || status === 'stale' ? delta : null,
    deltaPct: status === 'ok' || status === 'stale' ? deltaPct : null,
    unit: def.unit,
    asOf: current.asOf,
    sourceFamily: def.sourceFamily,
    status,
    glossaryPath: def.glossaryPath,
  };
}

export function rankMovers(board: MetricRow[], n = 5): { up: MetricMove[]; down: MetricMove[] } {
  const eligible = board.filter(
    (r) => r.status === 'ok' && r.level != null && r.deltaPct != null && Number.isFinite(r.deltaPct),
  );
  const up = [...eligible]
    .filter((r) => (r.deltaPct as number) > 0)
    .sort((a, b) => (b.deltaPct as number) - (a.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  const down = [...eligible]
    .filter((r) => (r.deltaPct as number) < 0)
    .sort((a, b) => (a.deltaPct as number) - (b.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  return { up, down };
}
