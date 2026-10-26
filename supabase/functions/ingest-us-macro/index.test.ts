import { describe, expect, it, vi } from 'vitest';
import { processFiscal, toFiscalCapacityObservations, toMetricObservations } from './fiscal.ts';
import { fromTreasuryDirect, processAuctions, toAuctionRecord, toTenYearAuctionMetricObservations } from './auctions.ts';

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

// Real 2026-10-15 8-Week bill as published by both sources (amounts in USD).
const FISCALDATA_8W = {
    auction_date: '2026-10-15', security_type: 'Bill', security_term: '8-Week', original_security_term: '8-Week',
    bid_to_cover_ratio: '2.260000', high_yield: 'null', total_tendered: '244853623300', total_accepted: '112075623300',
    primary_dealer_accepted: '48345400000', indirect_bidder_accepted: '47892307000', direct_bidder_accepted: '5817520000',
};
const TREASURYDIRECT_8W = {
    competitiveAuctionCloseDate: '2026-10-15T00:00:00', securityType: 'Bill', securityTerm: '8-Week', originalSecurityTerm: '8-Week',
    bidToCoverRatio: '2.26', highYield: '', grandTotalParRecognized: '244853623300', grandTotalParAwarded: '112075623300',
    primaryDealersCompetitiveParAwarded: '48345400000', indirectBiddersCompetitiveParAwarded: '47892307000',
    directBiddersCompetitiveParAwarded: '5817520000',
};
// Auctioned after FiscalData's last published results: FiscalData row has null results.
const FISCALDATA_5Y_PENDING = {
    auction_date: '2026-10-22', security_type: 'Note', security_term: '5-Year', original_security_term: '5-Year',
    bid_to_cover_ratio: 'null', high_yield: 'null', total_tendered: 'null', total_accepted: 'null',
    primary_dealer_accepted: 'null', indirect_bidder_accepted: 'null', direct_bidder_accepted: 'null',
};
const TREASURYDIRECT_5Y = {
    competitiveAuctionCloseDate: '2026-10-22T00:00:00', securityType: 'Note', securityTerm: '5-Year', originalSecurityTerm: '5-Year',
    bidToCoverRatio: '2.41', highYield: '2.367', grandTotalParRecognized: '63000000000', grandTotalParAwarded: '26000000000',
    primaryDealersCompetitiveParAwarded: '3900000000', indirectBiddersCompetitiveParAwarded: '18200000000',
    directBiddersCompetitiveParAwarded: '3900000000',
};

function mockSupabase() {
    const upserts: Record<string, any[]> = {};
    return {
        upserts,
        client: {
            from: (table: string) => ({
                upsert: (rows: any[]) => {
                    upserts[table] = rows;
                    return Promise.resolve({ error: null });
                },
            }),
        } as any,
    };
}

describe('US Treasury auction sources', () => {
    it('maps TreasuryDirect fields to the same record FiscalData produces', () => {
        const fromDirect = toAuctionRecord(fromTreasuryDirect(TREASURYDIRECT_8W));
        expect(fromDirect).toEqual(expect.objectContaining({
            auction_date: '2026-10-15', security_type: 'Bill', term: '8-Week', bid_to_cover: 2.26,
            total_tendered: 244853623300, total_accepted: 112075623300, high_yield: null,
        }));
        expect(fromDirect!.primary_dealer_pct).toBeCloseTo(43.1364, 3);
        expect(fromDirect!.indirect_bidder_pct).toBeCloseTo(42.7321, 3);
    });

    it('skips auctions whose results are not published yet', () => {
        expect(toAuctionRecord({
            auctionDate: '2026-10-22', securityType: 'Note', securityTerm: '5-Year', originalTerm: '5-Year',
            bidToCover: 'null', highYield: 'null', totalTendered: 'null', totalAccepted: 'null',
            primaryDealerAccepted: 'null', indirectBidderAccepted: 'null', directBidderAccepted: 'null',
        })).toBeNull();
    });

    it('keeps FiscalData canonical and fills its publication lag from TreasuryDirect', async () => {
        vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(String(url).includes('fiscaldata')
                ? { data: [FISCALDATA_5Y_PENDING, FISCALDATA_8W] }
                : [TREASURYDIRECT_5Y, { ...TREASURYDIRECT_8W, bidToCoverRatio: '9.99' }]),
        })));
        const { client, upserts } = mockSupabase();
        const result = await processAuctions(client);
        vi.unstubAllGlobals();

        expect(result).toEqual(expect.objectContaining({ success: true, count: 2 }));
        const rows = upserts['us_treasury_auctions'];
        expect(rows.find((r) => r.term === '8-Week').bid_to_cover).toBe(2.26);
        expect(rows.find((r) => r.term === '5-Year')).toEqual(expect.objectContaining({ auction_date: '2026-10-22', bid_to_cover: 2.41 }));
    });

    it('falls back to FiscalData alone when TreasuryDirect is unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn((url: string) => String(url).includes('fiscaldata')
            ? Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [FISCALDATA_8W] }) })
            : Promise.reject(new Error('network down'))));
        const { client, upserts } = mockSupabase();
        const result = await processAuctions(client);
        vi.unstubAllGlobals();

        expect(result).toEqual(expect.objectContaining({ success: true, count: 1 }));
        expect(upserts['us_treasury_auctions']).toHaveLength(1);
    });

    it('labels 10-Year metric observations with the source that supplied them', async () => {
        const tenYearDirect = { ...TREASURYDIRECT_5Y, securityTerm: '10-Year', originalSecurityTerm: '10-Year' };
        vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(String(url).includes('fiscaldata') ? { data: [] } : [tenYearDirect]),
        })));
        const { client, upserts } = mockSupabase();
        await processAuctions(client);
        vi.unstubAllGlobals();

        expect(upserts['metric_observations'].every((r) => r.source_ref === 'live_api:treasurydirect')).toBe(true);
    });
});

