import { describe, expect, it } from 'vitest';
import { fromBojMonetaryBase, fromFredJpnAssets } from './boj.ts';

describe('BoJ balance sheet ingestion', () => {
    it('converts FRED JPNASSETS (100 million JPY) to trillion JPY', () => {
        expect(fromFredJpnAssets([
            { date: '2026-09-01', value: '6250253' },
            { date: '2026-08-01', value: '.' },
        ])).toEqual([{
            metric_id: 'BOJ_TOTAL_ASSETS_TRJPY',
            as_of_date: '2026-09-01',
            value: 625.0253,
            provenance: 'api_live',
            source_ref: 'live_api:fred:JPNASSETS',
        }]);
    });

    it('maps the BoJ MABS1AN11 response to monthly trillion-JPY rows', () => {
        const body = {
            STATUS: 200,
            RESULTSET: [{
                SERIES_CODE: 'MABS1AN11',
                UNIT: '100 million yen',
                VALUES: { SURVEY_DATES: [202608, 202609, 202610], VALUES: [5430070, 5328464, null] },
            }],
        };
        expect(fromBojMonetaryBase(body)).toEqual([
            { metric_id: 'BOJ_MONETARY_BASE_TRJPY', as_of_date: '2026-08-01', value: 543.007, provenance: 'api_live', source_ref: 'live_api:boj:MABS1AN11' },
            { metric_id: 'BOJ_MONETARY_BASE_TRJPY', as_of_date: '2026-09-01', value: 532.8464, provenance: 'api_live', source_ref: 'live_api:boj:MABS1AN11' },
        ]);
    });

    it('refuses to write when the BoJ unit is not 100 million yen', () => {
        const body = { RESULTSET: [{ SERIES_CODE: 'MABS1AN11', UNIT: 'billion yen', VALUES: { SURVEY_DATES: [202609], VALUES: [532] } }] };
        expect(() => fromBojMonetaryBase(body)).toThrow(/unit changed/);
    });
});
