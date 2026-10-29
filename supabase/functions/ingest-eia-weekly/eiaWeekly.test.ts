import { describe, it, expect } from 'vitest';
import { EIA_WEEKLY_SERIES, buildEiaUrl, rowsToObservations, startDate } from './eiaWeekly.ts';

const crude = EIA_WEEKLY_SERIES.find(s => s.id === 'WCESTUS1')!;
const spr = EIA_WEEKLY_SERIES.find(s => s.id === 'WCSSTUS1')!;
const NOW = '2026-10-29T15:00:00.000Z';

describe('rowsToObservations', () => {
  it('stores EIA values unscaled for thousand-barrel series', () => {
    const [obs] = rowsToObservations(crude, [{ period: '2026-10-23', value: '410625' }], NOW);
    expect(obs).toMatchObject({ metric_id: 'EIA_WKLY_CRUDE_STOCKS_KBBL', as_of_date: '2026-10-23', value: 410625, provenance: 'api_live' });
    expect(obs.source_ref).toBe('eia:api_v2:petroleum/stoc/wstk:WCESTUS1');
  });

  it('converts SPR from thousand to million barrels without float noise', () => {
    const [obs] = rowsToObservations(spr, [{ period: '2026-10-23', value: '282583' }], NOW);
    expect(obs.value).toBe(282.583);
  });

  it('drops null, empty and non-numeric values instead of storing zeros', () => {
    const rows = [
      { period: '2026-10-23', value: null },
      { period: '2026-10-16', value: '' },
      { period: '2026-10-09', value: 'NA' },
      { period: '2026-10-02', value: '409000' },
    ];
    const out = rowsToObservations(crude, rows, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].as_of_date).toBe('2026-10-02');
  });

  it('drops rows with a malformed period', () => {
    expect(rowsToObservations(crude, [{ period: '2026-10', value: '1' }], NOW)).toHaveLength(0);
  });
});

describe('buildEiaUrl', () => {
  it('requests one series, newest first, from the given start date', () => {
    const url = new URL(buildEiaUrl(crude, 'KEY', '2015-01-01', 0, 5000));
    expect(url.pathname).toBe('/v2/petroleum/stoc/wstk/data/');
    expect(url.searchParams.get('facets[series][]')).toBe('WCESTUS1');
    expect(url.searchParams.get('frequency')).toBe('weekly');
    expect(url.searchParams.get('start')).toBe('2015-01-01');
    expect(url.searchParams.get('length')).toBe('5000');
  });
});

describe('startDate', () => {
  it('backfills from 2015 for the 5-year band history', () => {
    expect(startDate(true, new Date('2026-10-29T00:00:00Z'))).toBe('2015-01-01');
  });

  it('re-reads the last 12 weeks on a normal run so revisions are picked up', () => {
    expect(startDate(false, new Date('2026-10-29T00:00:00Z'))).toBe('2026-08-06');
  });
});

describe('series registry', () => {
  it('has unique ids and metric ids', () => {
    expect(new Set(EIA_WEEKLY_SERIES.map(s => s.id)).size).toBe(EIA_WEEKLY_SERIES.length);
    expect(new Set(EIA_WEEKLY_SERIES.map(s => s.metricId)).size).toBe(EIA_WEEKLY_SERIES.length);
  });
});
