// src/features/regime-digest/lib/validateMetric.ts
import type { MetricDef, MetricStatus } from './types';

export interface ValidatedObservation {
  status: MetricStatus;
  level: number | null;
  asOf: string | null;
}

function daysBetween(asOf: string, now: Date): number {
  const a = new Date(asOf + (asOf.length === 10 ? 'T00:00:00Z' : ''));
  return (now.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function validateObservation(
  def: MetricDef,
  value: number | null | undefined,
  asOf: string | null | undefined,
  now: Date,
): ValidatedObservation {
  if (value == null || !Number.isFinite(Number(value))) {
    return { status: 'missing', level: null, asOf: asOf ?? null };
  }
  const n = Number(value);
  if (n < def.min || n > def.max) {
    return { status: 'failed_validation', level: null, asOf: asOf ?? null };
  }
  if (!asOf) {
    return { status: 'stale', level: n, asOf: null };
  }
  if (daysBetween(asOf, now) > def.staleDays) {
    return { status: 'stale', level: n, asOf };
  }
  return { status: 'ok', level: n, asOf };
}
