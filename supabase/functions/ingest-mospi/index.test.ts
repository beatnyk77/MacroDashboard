/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-mospi/index.test.ts
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./mospi-client.ts', () => {
    // Real MoSPI ASI responses always carry sector="Combined" (an
    // ownership-type label, not an industry) and require an explicit
    // indicator_code per call — GVA=19, Persons Engaged=31, Fixed Capital=3 —
    // each broken out per 3-digit NIC code (e.g. two NIC codes both
    // reporting "Gross Value Added" for the same state/year, in ₹ lakhs).
    const BY_INDICATOR_CODE: Record<number, unknown[]> = {
        19: [
            { state: 'Maharashtra', year: '2024-25', sector: 'Combined', indicator: 'Gross Value Added', nic_code: '271', value: '80000' },
            { state: 'Maharashtra', year: '2024-25', sector: 'Combined', indicator: 'Gross Value Added', nic_code: '279', value: '40000' },
        ],
        31: [
            { state: 'Maharashtra', year: '2024-25', sector: 'Combined', indicator: 'Total Number of Persons Engaged', nic_code: '271', value: '300000' },
            { state: 'Maharashtra', year: '2024-25', sector: 'Combined', indicator: 'Total Number of Persons Engaged', nic_code: '279', value: '200000' },
        ],
        3: [
            { state: 'Maharashtra', year: '2024-25', sector: 'Combined', indicator: 'Fixed Capital', nic_code: '271', value: '5000' },
        ],
    };

    // Tracked in module-level closure (not an instance field) so the test
    // below can inspect calls regardless of which MoSPIClient instance
    // doIngestMospi constructs internally.
    const asiCallLog: { state_code?: string; indicator_code?: number; limit?: number }[] = [];

    class MoSPIClient {
        getEnergyData = vi.fn().mockResolvedValue({ data: [] });
        getASIData = vi.fn().mockImplementation((params: { indicator_code?: number; state_code?: string; limit?: number }) => {
            asiCallLog.push(params);
            return Promise.resolve({ data: BY_INDICATOR_CODE[params.indicator_code ?? -1] ?? [] });
        });
    }
    return { MoSPIClient, __asiCallLog: asiCallLog };
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

    it('always classifies sector as all_industries, never MoSPI\'s raw "Combined" ownership label', async () => {
        const { client, upsertCalls } = makeSupabaseMock();

        await doIngestMospi(client as any);

        const asiCalls = upsertCalls.filter((c) => c.table === 'india_asi');
        expect(asiCalls.length).toBeGreaterThan(0);
        for (const call of asiCalls) {
            expect((call.payload as { sector?: string }).sector).toBe('all_industries');
        }
    });

    it('sums values across every NIC-code row instead of overwriting with the last one seen, converting lakhs to crores', async () => {
        const { client, upsertCalls } = makeSupabaseMock();

        await doIngestMospi(client as any);

        const asiCalls = upsertCalls.filter((c) => c.table === 'india_asi');
        const payload = asiCalls[0].payload as {
            gva_crores: number;
            employment_thousands: number;
            fixed_capital_crores: number;
        };
        // (80000 + 40000) lakh / 100 = 1200 crore, not 120000 (unit bug) and
        // not just the last NIC code's value seen (overwrite bug).
        expect(payload.gva_crores).toBe(1200);
        // (300000 + 200000) / 1000 = 500, not just the last value seen.
        expect(payload.employment_thousands).toBe(500);
        // 5000 lakh / 100 = 50 crore.
        expect(payload.fixed_capital_crores).toBe(50);
    });

    it('requests each ASI indicator explicitly with a high row limit, not the ~10-row default page', async () => {
        const mospiModule = (await import('./mospi-client.ts')) as unknown as {
            __asiCallLog: { state_code?: string; indicator_code?: number; limit?: number }[];
        };
        mospiModule.__asiCallLog.length = 0; // reset from any prior test's calls

        const { client } = makeSupabaseMock();
        await doIngestMospi(client as any);

        const callsForOneState = mospiModule.__asiCallLog.filter((c) => c.state_code === '01');
        const requestedIndicatorCodes = callsForOneState.map((c) => c.indicator_code).sort((a, b) => (a ?? 0) - (b ?? 0));
        expect(requestedIndicatorCodes).toEqual([3, 19, 31]);
        for (const call of callsForOneState) {
            expect(call.limit).toBeGreaterThanOrEqual(500);
        }
    });
});
