import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchMarketOverview,
    FALLBACK_MARKET_OVERVIEW,
} from './marketTransmissionApi';

describe('marketTransmissionApi', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns fallback data when server fetch rejects or is offline', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

        const data = await fetchMarketOverview();
        expect(data).toBeDefined();
        expect(data.sector_rotation.sectors.length).toBe(11);
        expect(data.market_breadth.total_stocks).toBeGreaterThan(10000);
        expect(data.equity_risk_premium.index).toContain('S&P 500');
    });

    it('returns server response when fetch succeeds', async () => {
        const mockPayload = {
            ...FALLBACK_MARKET_OVERVIEW,
            sector_rotation: {
                ...FALLBACK_MARKET_OVERVIEW.sector_rotation,
                regime_signal: {
                    regime: 'Expansionary',
                    conviction: 'High' as const,
                    summary: 'Mock server response',
                },
            },
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockPayload,
        } as Response);

        const data = await fetchMarketOverview({ tenYearYield: 4.25 });
        expect(data.sector_rotation.regime_signal.regime).toBe('Expansionary');
    });

    it('validates fallback cyclical vs defensive spread calculations', () => {
        const spreads = FALLBACK_MARKET_OVERVIEW.sector_rotation.spreads;
        expect(spreads['1W']).toBeDefined();
        expect(spreads['1M']).toBeDefined();
        expect(spreads['3M']).toBeDefined();
        expect(spreads['1Y']).toBeDefined();

        // Cyclical spread = cyclical_avg - defensive_avg
        const oneWeek = spreads['1W'];
        const calculatedSpread = Number((oneWeek.cyclical_avg - oneWeek.defensive_avg).toFixed(2));
        expect(oneWeek.spread).toBe(calculatedSpread);
    });

    it('validates ERP formula in fallback telemetry', () => {
        const erp = FALLBACK_MARKET_OVERVIEW.equity_risk_premium;
        // ERP = forward_earnings_yield - ten_year_yield
        const computed = Number((erp.forward_earnings_yield - erp.ten_year_yield).toFixed(2));
        expect(erp.erp).toBe(computed);
    });
});
