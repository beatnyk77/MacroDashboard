import { describe, expect, it, vi } from 'vitest';
import { processFiscal, toFiscalCapacityObservations, toMetricObservations } from './fiscal.ts';
import { toTenYearAuctionMetricObservations } from './auctions.ts';

describe('US fiscal FRED ingestion', () => {
    it('maps both comparison series to canonical metric observations', () => {
        const fetchedAt = '2026-08-26T00:00:00.000Z';

        expect(toMetricObservations('FDEFX', [
            { date: '2026-01-01', value: '5123.4' },
            { date: '2025-10-01', value: '.' },
        ], fetchedAt)).toEqual([{
            metric_id: 'US_DEFENSE_SPENDING',
            as_of_date: '2026-01-01',
            value: 5123.4,
            last_updated_at: fetchedAt,
        }]);

        expect(toMetricObservations('A091RC1Q027SBEA', [
            { date: '2026-01-01', value: '1456.7' },
        ], fetchedAt)).toEqual([{
            metric_id: 'US_FEDERAL_INTEREST_PAYMENTS',
            as_of_date: '2026-01-01',
            value: 1456.7,
            last_updated_at: fetchedAt,
        }]);

        expect(toFiscalCapacityObservations([{
            date: '2026-01-01',
            interest_expense: 1456.7,
            total_receipts: 4800,
            entitlements: 3000,
            gdp: 30000,
        }], fetchedAt)).toEqual(expect.arrayContaining([
            expect.objectContaining({ metric_id: 'US_FISCAL_INTEREST_TO_RECEIPTS_PCT', value: expect.closeTo(30.3479, 4) }),
            expect.objectContaining({ metric_id: 'US_FISCAL_INTEREST_TO_GDP_PCT', value: expect.closeTo(4.8557, 4) }),
            expect.objectContaining({ metric_id: 'US_FISCAL_MANDATORY_TO_RECEIPTS_PCT', value: expect.closeTo(92.8479, 4) }),
        ]));
    });

    it('upserts quarterly defense and interest history with live FRED provenance', async () => {
        const observationsUpsert = vi.fn().mockResolvedValue({ error: null });
        const fiscalStressUpsert = vi.fn().mockResolvedValue({ error: null });
        const metricsUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
        const supabase = {
            from: vi.fn((table: string) => {
                if (table === 'us_fiscal_stress') return { upsert: fiscalStressUpsert };
                if (table === 'metric_observations') return { upsert: observationsUpsert };
                if (table === 'metrics') return { update: metricsUpdate };
                throw new Error(`Unexpected table: ${table}`);
            }),
        } as any;

        vi.stubGlobal('fetch', vi.fn((input: string) => {
            const seriesId = new URL(input).searchParams.get('series_id');
            const values: Record<string, any[]> = {
                FDEFX: [{ date: '2026-01-01', value: '5123.4' }],
                A091RC1Q027SBEA: [{ date: '2026-01-01', value: '1456.7' }],
                FGRECPT: [{ date: '2026-01-01', value: '4800' }],
                W068RC1Q027SBEA: [{ date: '2026-01-01', value: '3000' }],
                A074RC1Q027SBEA: [{ date: '2026-01-01', value: '2500' }],
                W780RC1Q027SBEA: [{ date: '2026-01-01', value: '1500' }],
                GDP: [{ date: '2026-01-01', value: '30000' }],
            };
            return Promise.resolve({ ok: true, json: async () => ({ observations: values[seriesId!] }) });
        }));

        try {
            const result = await processFiscal(supabase, 'test-key');

            expect(result.success).toBe(true);
            expect(observationsUpsert).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ metric_id: 'US_DEFENSE_SPENDING', as_of_date: '2026-01-01', value: 5123.4 }),
                    expect.objectContaining({ metric_id: 'US_FEDERAL_INTEREST_PAYMENTS', as_of_date: '2026-01-01', value: 1456.7 }),
                ]),
                expect.anything(),
            );
            const rows = observationsUpsert.mock.calls[0][0];
            expect(rows).toHaveLength(11);
            expect(rows.every((row: any) => row.source_ref === 'live_api:fred' && row.is_provisional === false)).toBe(true);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});

describe('US Treasury auction metric ingestion', () => {
    it('maps the normalized 10-Year auction fields to canonical observations', () => {
        const rows = toTenYearAuctionMetricObservations([{
            auction_date: '2026-08-20',
            security_type: 'Note',
            term: '10-Year',
            bid_to_cover: 2.41,
            high_yield: 4.2,
            total_tendered: 241,
            total_accepted: 100,
            primary_dealer_pct: 14,
            indirect_bidder_pct: 68,
            direct_bidder_pct: 18,
            demand_strength_score: 1.6388,
        }], '2026-08-26T00:00:00.000Z');

        expect(rows).toHaveLength(4);
        expect(rows).toEqual(expect.arrayContaining([
            expect.objectContaining({ metric_id: 'US_TREASURY_10Y_BID_TO_COVER', value: 2.41 }),
            expect.objectContaining({ metric_id: 'US_TREASURY_10Y_INDIRECT_PCT', value: 68 }),
            expect.objectContaining({ metric_id: 'US_TREASURY_10Y_PRIMARY_DEALER_PCT', value: 14 }),
            expect.objectContaining({ metric_id: 'US_TREASURY_10Y_DEMAND_SCORE', value: 1.6388 }),
        ]));
    });
});
