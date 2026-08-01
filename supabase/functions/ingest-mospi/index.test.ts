/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-mospi/index.test.ts
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./mospi-client.ts', () => {
    class MoSPIClient {
        getEnergyData = vi.fn().mockResolvedValue({ data: [] });
        getASIData = vi.fn().mockResolvedValue({
            data: [
                { state: 'Maharashtra', year: '2024-25', sector: 'Manufacturing', indicator: 'Gross Value Added', value: '120000' },
                { state: 'Maharashtra', year: '2024-25', sector: 'Manufacturing', indicator: 'Total Number of Persons Engaged', value: '500000' },
            ],
        });
    }
    return { MoSPIClient };
});

vi.mock('../_shared/ingest_utils.ts', () => ({
    upsertObservations: vi.fn().mockResolvedValue({ count: 1 }),
}));

vi.mock('../_shared/handler.ts', () => ({
    serveIngest: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({})),
}));

import { doIngestMospi } from './index.ts';

function makeSupabaseMock() {
    const upsertCalls: { table: string; payload: unknown }[] = [];
    return {
        client: {
            from: (table: string) => ({
                upsert: (payload: unknown) => {
                    upsertCalls.push({ table, payload });
                    return Promise.resolve({ error: null });
                },
            }),
        },
        upsertCalls,
    };
}

describe('doIngestMospi ASI ingestion', () => {
    it('always sets a non-null as_of_date on india_asi upserts', async () => {
        const { client, upsertCalls } = makeSupabaseMock();

        await doIngestMospi(client as any);

        const asiCalls = upsertCalls.filter((c) => c.table === 'india_asi');
        expect(asiCalls.length).toBeGreaterThan(0);
        for (const call of asiCalls) {
            expect((call.payload as { as_of_date?: string }).as_of_date).toBeTruthy();
        }
    });
});
