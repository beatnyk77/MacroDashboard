import { describe, expect, it } from 'vitest';
import {
  buildIndiaCashObservations,
  findCashObservationRevisions,
  planNseCategoryBackfillDates,
} from '../indiaInstitutionalBackfill.ts';
import type { ParsedCashFlow } from '../indiaInstitutionalSources.ts';

const row = (participant: 'FII' | 'DII'): ParsedCashFlow => ({
  participant,
  date: '2026-08-28',
  buyValue: participant === 'FII' ? 120 : 90,
  sellValue: participant === 'FII' ? 100 : 80,
  netValue: participant === 'FII' ? 20 : 10,
  sourceRef: 'official_archive:nse:https://nsearchives.nseindia.com/archives/equities/cat/cat_turnover_280826.xls',
  sourceHash: `fnv1a:${participant === 'FII' ? 'fii' : 'dii'}`,
  parserVersion: '1.3.0',
  sourceFields: { participant },
});

describe('India institutional NSE backfill', () => {
  it('builds stable compound-key observations with official archive provenance', () => {
    const first = buildIndiaCashObservations([row('FII'), row('DII')], '2026-09-08T00:00:00.000Z');
    const second = buildIndiaCashObservations([row('FII'), row('DII')], '2026-09-09T00:00:00.000Z');

    expect(first.map(({ metric_id, as_of_date }) => `${metric_id}:${as_of_date}`)).toEqual([
      'IN_FII_CASH_NET:2026-08-28',
      'IN_DII_CASH_NET:2026-08-28',
    ]);
    expect(first[0]).toMatchObject({ provenance: 'verified_historical', is_provisional: false });
    expect(first[0].metadata).toMatchObject({ source_name: 'NSE', native_frequency: 'daily', coverage_state: 'observed', source_scope: 'nse_cash_segment' });
    expect(second.map(({ last_updated_at: _ignored, ...observation }) => observation)).toEqual(first.map(({ last_updated_at: _ignored, ...observation }) => observation));
  });

  it('does not create revisions when an idempotent rerun sees the same source hash', () => {
    const incoming = buildIndiaCashObservations([row('FII'), row('DII')], '2026-09-08T00:00:00.000Z');
    const accepted = incoming.map((observation) => ({
      metric_id: observation.metric_id,
      as_of_date: observation.as_of_date,
      value: observation.value,
      source_ref: observation.source_ref,
      metadata: observation.metadata,
    }));

    expect(findCashObservationRevisions(accepted, incoming)).toEqual([]);
    expect(findCashObservationRevisions([{ ...accepted[0], metadata: { ...accepted[0].metadata, source_hash: 'fnv1a:older' } }], incoming)).toHaveLength(1);
  });

  it('plans weekdays backwards before the earliest accepted session and stops at the requested evidence count', () => {
    const dates = planNseCategoryBackfillDates('2026-09-07', 7, 252);

    expect(dates[0]).toBe('2026-09-04');
    expect(dates).toHaveLength(245);
    expect(dates.every((date) => ![0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay()))).toBe(true);
  });
});
