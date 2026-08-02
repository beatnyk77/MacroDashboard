import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertObservations, validateNumericData, fetchAlphaVantageCommodity } from '../ingest_utils.ts';

// ─── Supabase mock factory ────────────────────────────────────────────────────

function makeSupabaseMock(upsertResult: { error: unknown }) {
  const upsertSpy = vi.fn().mockResolvedValue(upsertResult);
  const eqSpy = vi.fn().mockResolvedValue({ error: null });
  const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });

  const fromSpy = vi.fn().mockImplementation((table: string) => {
    if (table === 'metric_observations') return { upsert: upsertSpy };
    if (table === 'metrics') return { update: updateSpy };
    return {};
  });

  return {
    supabase: { from: fromSpy } as unknown as SupabaseClient,
    upsertSpy,
    updateSpy,
    eqSpy,
    fromSpy,
  };
}

// ─── upsertObservations ───────────────────────────────────────────────────────

describe('upsertObservations', () => {
  it('returns { count: 0 } immediately when observations array is empty', async () => {
    const { supabase, upsertSpy } = makeSupabaseMock({ error: null });
    const result = await upsertObservations(supabase, []);
    expect(result).toEqual({ count: 0 });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('calls supabase.upsert with onConflict "metric_id, as_of_date" — the ingestion contract', async () => {
    const { supabase, upsertSpy } = makeSupabaseMock({ error: null });
    const rows = [{ metric_id: 'gold_price', as_of_date: '2024-01-01', value: 2000 }];

    await upsertObservations(supabase, rows);

    expect(upsertSpy).toHaveBeenCalledWith(
      rows,
      expect.objectContaining({ onConflict: 'metric_id, as_of_date' }),
    );
  });

  it('returns { count: N } equal to number of observations on success', async () => {
    const { supabase } = makeSupabaseMock({ error: null });
    const rows = [
      { metric_id: 'a', as_of_date: '2024-01-01', value: 1 },
      { metric_id: 'b', as_of_date: '2024-01-01', value: 2 },
    ];

    const result = await upsertObservations(supabase, rows);
    expect(result).toEqual({ count: 2 });
  });

  it('updates each unique metric_id in the metrics table after successful upsert', async () => {
    const { supabase, updateSpy, eqSpy } = makeSupabaseMock({ error: null });
    const rows = [
      { metric_id: 'alpha', as_of_date: '2024-01-01', value: 10 },
      { metric_id: 'alpha', as_of_date: '2024-01-02', value: 11 }, // same metric_id, deduplicated
      { metric_id: 'beta', as_of_date: '2024-01-01', value: 20 },
    ];

    await upsertObservations(supabase, rows);

    // Two unique metric_ids → two update calls
    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(eqSpy).toHaveBeenCalledWith('id', 'alpha');
    expect(eqSpy).toHaveBeenCalledWith('id', 'beta');
  });

  it('throws when supabase upsert returns an error — does not swallow it', async () => {
    const dbError = new Error('DB constraint violation');
    const { supabase } = makeSupabaseMock({ error: dbError });
    const rows = [{ metric_id: 'x', as_of_date: '2024-01-01', value: 1 }];

    await expect(upsertObservations(supabase, rows)).rejects.toThrow('DB constraint violation');
  });

  it('stamps source_ref and is_provisional from provenanceDefaults', async () => {
    const { supabase, upsertSpy } = makeSupabaseMock({ error: null });
    const rows = [{ metric_id: 'CN_POLICY_RATE', as_of_date: '2025-10-01', value: 3.1 }];

    await upsertObservations(supabase, rows, {
      source_ref: 'fallback:china-macro-lpr-hardcoded',
      is_provisional: true,
    });

    expect(upsertSpy).toHaveBeenCalledWith(
      [{
        metric_id: 'CN_POLICY_RATE',
        as_of_date: '2025-10-01',
        value: 3.1,
        source_ref: 'fallback:china-macro-lpr-hardcoded',
        is_provisional: true,
      }],
      expect.objectContaining({ onConflict: 'metric_id, as_of_date' }),
    );
  });

  it('does not override per-row source_ref when already set', async () => {
    const { supabase, upsertSpy } = makeSupabaseMock({ error: null });
    const rows = [{
      metric_id: 'GOLD_PRICE_USD',
      as_of_date: '2024-01-01',
      value: 2000,
      source_ref: 'live_api:ingest-gold',
      is_provisional: false,
    }];

    await upsertObservations(supabase, rows, {
      source_ref: 'fallback:should-not-apply',
      is_provisional: true,
    });

    expect(upsertSpy).toHaveBeenCalledWith(
      [expect.objectContaining({
        source_ref: 'live_api:ingest-gold',
        is_provisional: false,
      })],
      expect.any(Object),
    );
  });
});

// ─── validateNumericData ──────────────────────────────────────────────────────

describe('validateNumericData', () => {
  it('returns true when all specified keys are finite numbers', () => {
    expect(validateNumericData({ price: 100, ratio: 1.5, zero: 0 }, ['price', 'ratio', 'zero'])).toBe(true);
  });

  it('returns false when a key holds NaN', () => {
    expect(validateNumericData({ value: NaN }, ['value'])).toBe(false);
  });

  it('returns false when a key holds null (typeof null is not "number")', () => {
    expect(validateNumericData({ value: null }, ['value'])).toBe(false);
  });

  it('returns false when a key holds undefined', () => {
    expect(validateNumericData({ value: undefined }, ['value'])).toBe(false);
  });

  it('returns false when a key holds a string', () => {
    expect(validateNumericData({ value: '42' }, ['value'])).toBe(false);
  });

  it('characterization: Infinity passes because isNaN(Infinity) is false', () => {
    // The current implementation checks: typeof val === 'number' && !isNaN(val)
    // Infinity satisfies both conditions — this test locks that behavior.
    expect(validateNumericData({ value: Infinity }, ['value'])).toBe(true);
    expect(validateNumericData({ value: -Infinity }, ['value'])).toBe(true);
  });

  it('returns false if ANY key fails, even when others are valid', () => {
    expect(validateNumericData({ good: 1, bad: NaN }, ['good', 'bad'])).toBe(false);
  });

  it('returns true for an empty keys array (vacuously true)', () => {
    expect(validateNumericData({}, [])).toBe(true);
  });
});

// ─── fetchAlphaVantageCommodity ────────────────────────────────────────────────

describe('fetchAlphaVantageCommodity', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('includes a symbol= param when one is provided (required by GOLD_SILVER_HISTORY)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ date: '2026-08-01', value: '2050.00' }] }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await fetchAlphaVantageCommodity('GOLD_SILVER_HISTORY', 'test-key', 'daily', 'GOLD');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('function=GOLD_SILVER_HISTORY');
    expect(calledUrl).toContain('symbol=GOLD');
    expect(calledUrl).toContain('interval=daily');
  });

  it('omits symbol= entirely when none is provided (backward compatible with single-name functions like WTI/BRENT)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ date: '2026-08-01', value: '80.00' }] }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await fetchAlphaVantageCommodity('WTI', 'test-key', 'daily');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('symbol=');
  });

  it('throws with the raw message when AlphaVantage returns a Note/Information field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Information: 'rate limit exceeded' }),
    }) as unknown as typeof fetch;

    await expect(
      fetchAlphaVantageCommodity('GOLD_SILVER_HISTORY', 'test-key', 'daily', 'GOLD')
    ).rejects.toThrow('AlphaVantage Rate Limit or Info: rate limit exceeded');
  });
});
