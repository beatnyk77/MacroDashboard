import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn(),
    env: { get: vi.fn((key: string) => key === 'SEC_USER_AGENT' ? 'GraphiQuestor sec-ingest bot sec@example.com' : undefined) },
  };
});
import { ingestIssuer } from './index.ts';

function makeFact(periodIndex: number, overrides: Record<string, unknown> = {}) {
  const month = String(8 - periodIndex).padStart(2, '0');
  const day = String(30 - periodIndex).padStart(2, '0');
  return {
    accn: `0000123456-26-00000${periodIndex + 1}`,
    filed: `2026-${month}-${day}`,
    form: '10-Q',
    end: `2026-${month}-${day}`,
    val: 100 - periodIndex,
    ...overrides,
  };
}

function createSupabase() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'issuer-1', cik: '0000123456' }, error: null });
  const eq = vi.fn().mockReturnThis();
  const select = vi.fn().mockReturnThis();
  const from = vi.fn(() => ({ select, eq, maybeSingle, upsert }));
  return { client: { from } as never, from, upsert };
}

describe('ingestIssuer', () => {
  it('normalizes SEC payloads and upserts filing and XBRL evidence idempotently', async () => {
    const { client, upsert } = createSupabase();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ filings: { recent: {
        accessionNumber: ['0000123456-26-000001'], filingDate: ['2026-08-30'], acceptanceDateTime: ['2026-08-30T12:00:00.000Z'], form: ['10-Q'], primaryDocument: ['quarterly.htm'],
      } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ facts: { 'us-gaap': { CashAndCashEquivalentsAtCarryingValue: { units: { USD: [{ accn: '0000123456-26-000001', filed: '2026-08-30', form: '10-Q', end: '2026-07-31', val: 100 }] } } } } })))
      ;

    const result = await ingestIssuer('123456', client, fetchImpl);

    expect(result).toEqual({ filings: 1, evidence: 2 });
    expect(upsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ accession_number: '0000123456-26-000001', evidence_kind: 'filing_metadata', document_url: expect.stringContaining('quarterly.htm') }),
      expect.objectContaining({ evidence_kind: 'xbrl_fact', section_name: 'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-07-31' }),
    ]), { onConflict: 'cik,accession_number,section_name,evidence_kind', ignoreDuplicates: false });
  });

  it('filters company facts to signal concepts, dedupes periods, and caps stored history', async () => {
    const { client, upsert } = createSupabase();
    const revenueFacts = [
      makeFact(0),
      makeFact(0, { accn: '0000123456-26-009999', filed: '2026-08-01', val: 88 }),
      makeFact(1),
      makeFact(2),
      makeFact(3),
      makeFact(4),
      makeFact(5),
      makeFact(6),
    ];
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ filings: { recent: {
        accessionNumber: ['0000123456-26-000001'], filingDate: ['2026-08-30'], acceptanceDateTime: ['2026-08-30T12:00:00.000Z'], form: ['10-Q'], primaryDocument: ['quarterly.htm'],
      } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        facts: {
          'us-gaap': {
            Revenues: { units: { USD: revenueFacts } },
            Assets: { units: { USD: Array.from({ length: 20 }, (_, index) => makeFact(index, { val: 1_000 + index })) } },
          },
        },
      })));

    const result = await ingestIssuer('123456', client, fetchImpl);
    const rows = upsert.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    const xbrlRows = rows.filter((row) => row.evidence_kind === 'xbrl_fact');

    expect(result).toEqual({ filings: 1, evidence: 7 });
    expect(xbrlRows).toHaveLength(6);
    expect(xbrlRows.every((row) => String(row.section_name).startsWith('us-gaap:Revenues:USD:'))).toBe(true);
    expect(xbrlRows.some((row) => row.accession_number === '0000123456-26-000001')).toBe(true);
    expect(xbrlRows.some((row) => row.accession_number === '0000123456-26-009999')).toBe(false);
  });
});
