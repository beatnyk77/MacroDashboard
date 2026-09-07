import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseNseCategoryTurnoverRows,
  parseNseCashPayload,
  parseParticipantOiCsv,
  parseNsdlSectorHtml,
  validateCashFlow,
  validateSectorRows,
} from '../indiaInstitutionalSources.ts';

describe('India institutional source parsers', () => {
  it('reconstructs validated FII and DII cash rows from an official NSE category workbook', () => {
    const sourceUrl = 'https://nsearchives.nseindia.com/archives/equities/cat/cat_turnover_280826.xls';
    const rows = parseNseCategoryTurnoverRows([
      ['Category-wise turnover for 28-08-2026'],
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['08/28/2026', 'Bank', 361.1, 319.55],
      ['08/28/2026', 'Insurance Companies', 2013.04, 1724.83],
      ['08/28/2026', 'Mutual Funds', 11277.95, 7795.51],
      ['08/28/2026', 'AIF', 623.61, 546.53],
      ['08/28/2026', 'PMS', 818.69, 475.17],
      ['FPI Data as reported by NSDL on 31-08-2026'],
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['08/28/2026', 'FPI', 14228.85, 15653.17],
    ], sourceUrl);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ participant: 'FII', date: '2026-08-28', buyValue: 14228.85, sellValue: 15653.17, netValue: -1424.32 });
    expect(rows[1]).toMatchObject({ participant: 'DII', date: '2026-08-28', buyValue: 15094.39, sellValue: 10861.59, netValue: 4232.8 });
    expect(rows.every((row) => validateCashFlow(row).valid)).toBe(true);
    expect(rows[0].sourceRef).toBe(`official_archive:nse:${sourceUrl}`);
    expect(rows[0].sourceHash).toBe(parseNseCategoryTurnoverRows([
      ['Category-wise turnover for 28-08-2026'],
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['08/28/2026', 'Bank', 361.1, 319.55],
      ['08/28/2026', 'Insurance Companies', 2013.04, 1724.83],
      ['08/28/2026', 'Mutual Funds', 11277.95, 7795.51],
      ['08/28/2026', 'AIF', 623.61, 546.53],
      ['08/28/2026', 'PMS', 818.69, 475.17],
      ['FPI Data as reported by NSDL on 31-08-2026'],
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['08/28/2026', 'FPI', 14228.85, 15653.17],
    ], sourceUrl)[0].sourceHash);
  });

  it('rejects an incomplete NSE category workbook instead of publishing partial evidence', () => {
    const rows = parseNseCategoryTurnoverRows([
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['08/28/2026', 'Mutual Funds', 11277.95, 7795.51],
      ['08/28/2026', 'FPI', 14228.85, 15653.17],
    ], 'https://nsearchives.nseindia.com/incomplete.xls');

    expect(rows).toEqual([]);
  });

  it('accepts the formatted two-digit year emitted by the official XLS workbook', () => {
    const rows = parseNseCategoryTurnoverRows([
      ['Trade Date', 'Client Categories', 'Buy Value in Rs.Crores', 'Sell Value in Rs.Crores'],
      ['28-Aug-25', 'Bank', '1', '2'],
      ['28-Aug-25', 'Insurance Companies', '3', '4'],
      ['28-Aug-25', 'Mutual Funds', '5', '6'],
      ['28-Aug-25', 'AIF', '7', '8'],
      ['28-Aug-25', 'PMS', '9', '10'],
      ['28-Aug-25', 'FPI', '11', '12'],
    ], 'https://nsearchives.nseindia.com/official.xls');

    expect(rows.map((row) => row.date)).toEqual(['2025-08-28', '2025-08-28']);
  });

  it('parses and validates FII and DII NSE cash rows', () => {
    const rows = parseNseCashPayload(JSON.parse(readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/nse-cash-valid.json'), 'utf8')));
    expect(rows).toHaveLength(2);
    expect(rows[0].participant).toBe('FII');
    expect(validateCashFlow(rows[0]).valid).toBe(true);
    expect(rows[1].netValue).toBe(500);
  });

  it('rejects a cash row whose net does not reconcile', () => {
    const [row] = parseNseCashPayload(JSON.parse(readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/nse-cash-malformed.json'), 'utf8')));
    expect(validateCashFlow(row).valid).toBe(false);
  });

  it('parses participant OI by header names and exposes unavailable coverage', () => {
    const parsed = parseParticipantOiCsv(readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/participant-oi-valid.csv'), 'utf8'), '2026-08-29');
    expect(parsed.coverage).toBe('observed');
    expect(parsed.fii?.indexFutureNet).toBe(40);
    expect(parsed.fii?.putCallPositioning).toBe(0.9);
    expect(parsed.coverageReason).toBe('observed');
    const unavailable = parseParticipantOiCsv(readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/participant-oi-missing-fields.csv'), 'utf8'), '2026-08-29');
    expect(unavailable.coverage).toBe('unavailable');
    expect(unavailable.coverageReason).toBe('missing_required_fields');
    const noRows = parseParticipantOiCsv(readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/participant-oi-header-only.csv'), 'utf8'), '2026-08-29');
    expect(noRows.coverageReason).toBe('missing_participant_rows');
  });

  it('parses NSDL sectors and rejects duplicate sector keys', () => {
    const html = readFileSync(join(process.cwd(), 'supabase/functions/_shared/__tests__/fixtures/nsdl-sector-valid.html'), 'utf8');
    const rows = parseNsdlSectorHtml(html, 'https://nsdl.example/report', '2026-08-15');
    expect(rows).toHaveLength(2);
    expect(rows[0].sectorKey).toBe('financial_services');
    expect(validateSectorRows(rows).valid).toBe(true);
    expect(validateSectorRows([...rows, { ...rows[0] }]).valid).toBe(false);
    expect(validateSectorRows([{ ...rows[0], reportPeriodEnd: '2026-02-31', totalAumInrCrore: 900 }]).valid).toBe(false);
  });
});
