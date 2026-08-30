import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseNseCashPayload,
  parseParticipantOiCsv,
  parseNsdlSectorHtml,
  validateCashFlow,
  validateSectorRows,
} from '../indiaInstitutionalSources';

describe('India institutional source parsers', () => {
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
