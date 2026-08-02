/**
 * Run with an explicit path (auto-included by vitest.config.ts too):
 *   npx vitest run supabase/functions/gsc-sync/index.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ENV: Record<string, string> = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    GSC_SERVICE_ACCOUNT_KEY: JSON.stringify({
        client_email: 'test-sa@project.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
    }),
};

vi.stubGlobal('Deno', { env: { get: (key: string) => ENV[key] } });

const getGoogleAccessTokenMock = vi.fn();
vi.mock('./google-auth.ts', () => ({
    getGoogleAccessToken: (...args: unknown[]) => getGoogleAccessTokenMock(...args),
}));

const upsertMock = vi.fn().mockResolvedValue({ error: null });
// index.ts imports these via raw Deno-style URL specifiers, not bare
// package names — vi.mock must match the exact specifier string used.
vi.mock('https://esm.sh/@supabase/supabase-js@2.39.8', () => ({
    createClient: vi.fn(() => ({
        from: (table: string) => ({
            upsert: (rows: unknown, opts: unknown) => upsertMock(table, rows, opts),
        }),
    })),
}));
vi.mock('https://deno.land/std@0.177.0/http/server.ts', () => ({
    serve: vi.fn(),
}));

import { fetchAndUpsertGscData } from './index.ts';

describe('fetchAndUpsertGscData', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        getGoogleAccessTokenMock.mockReset().mockResolvedValue('fake-access-token');
        upsertMock.mockClear();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('throws a descriptive error and never upserts when the Search Console API call fails', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            text: async () => '{"error":{"message":"forbidden"}}',
        }) as unknown as typeof fetch;

        await expect(fetchAndUpsertGscData()).rejects.toThrow(
            /Google Search Console API request failed: HTTP 403/,
        );
        expect(upsertMock).not.toHaveBeenCalled();
    });

    it('upserts a correctly-shaped record on the happy path', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                rows: [
                    {
                        keys: ['2026-08-01', 'https://graphiquestor.com/', 'macro terminal', 'usa', 'MOBILE'],
                        impressions: 100,
                        clicks: 10,
                        ctr: 0.1,
                        position: 3.5,
                    },
                ],
            }),
        }) as unknown as typeof fetch;

        const result = await fetchAndUpsertGscData();

        expect(result).toEqual({ rowsUpserted: 1 });
        expect(upsertMock).toHaveBeenCalledTimes(1);
        const [table, rows, opts] = upsertMock.mock.calls[0];
        expect(table).toBe('gsc_performance');
        expect(rows).toEqual([
            {
                date: '2026-08-01',
                page: 'https://graphiquestor.com/',
                query: 'macro terminal',
                country: 'usa',
                device: 'MOBILE',
                impressions: 100,
                clicks: 10,
                ctr: 0.1,
                position: 3.5,
            },
        ]);
        expect(opts).toEqual({ onConflict: 'date,page,query,country,device' });
    });

    it('returns rowsUpserted: 0 and skips the upsert call when GSC returns no rows', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ rows: [] }),
        }) as unknown as typeof fetch;

        const result = await fetchAndUpsertGscData();

        expect(result).toEqual({ rowsUpserted: 0 });
        expect(upsertMock).not.toHaveBeenCalled();
    });
});
