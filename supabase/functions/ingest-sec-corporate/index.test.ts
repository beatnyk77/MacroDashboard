import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn(),
    env: { get: vi.fn((key: string) => key === 'SEC_USER_AGENT' ? 'GraphiQuestor sec-ingest bot sec@example.com' : undefined) },
  };
});
import { ingestIssuer } from './index.ts';

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
      expect.objectContaining({ evidence_kind: 'xbrl_fact', section_name: 'us-gaap:CashAndCashEquivalentsAtCarryingValue' }),
    ]), { onConflict: 'cik,accession_number,section_name,evidence_kind', ignoreDuplicates: false });
  });
});
