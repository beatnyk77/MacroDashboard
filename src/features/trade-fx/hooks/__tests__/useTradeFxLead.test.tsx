import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTradeFxLead } from '../useTradeFxLead';

const insertMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({ insert: insertMock })),
    },
}));

const trackEventMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

import { supabase } from '@/lib/supabase';

const BASE_PAYLOAD = {
    contactName: 'Analyst Name',
    email: 'analyst@fund.com',
    tradeRole: 'exporter' as const,
    currencyPair: 'USD/INR' as const,
    notionalRange: '1-5Cr' as const,
    partnerPreference: 'hdfc' as const,
    interestType: 'forward' as const,
};

describe('useTradeFxLead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        insertMock.mockResolvedValue({ error: null });
    });

    it('rejects empty name without touching the database', async () => {
        const { result } = renderHook(() => useTradeFxLead());

        let res;
        await act(async () => {
            res = await result.current.submitLead({ ...BASE_PAYLOAD, contactName: '  ' });
        });

        expect(res).toEqual({ ok: false, outcome: 'invalid' });
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('inserts trade_fx lead with extended subscriber fields', async () => {
        const { result } = renderHook(() => useTradeFxLead());

        await act(async () => {
            await result.current.submitLead(BASE_PAYLOAD);
        });

        expect(supabase.from).toHaveBeenCalledWith('subscribers');
        expect(insertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'analyst@fund.com',
                source: 'trade_fx',
                contact_name: 'Analyst Name',
                lead_type: 'trade_fx_bank_referral',
                trade_role: 'exporter',
                currency_pair: 'USD/INR',
                notional_range: '1-5Cr',
                partner_preference: 'hdfc',
                interest_type: 'forward',
                status: 'pending',
            }),
        );
        expect(trackEventMock).toHaveBeenCalled();
    });

    it('uses trade_fx_skydo lead type when Skydo is selected', async () => {
        const { result } = renderHook(() => useTradeFxLead());

        await act(async () => {
            await result.current.submitLead({ ...BASE_PAYLOAD, partnerPreference: 'skydo' });
        });

        expect(insertMock).toHaveBeenCalledWith(
            expect.objectContaining({ lead_type: 'trade_fx_skydo' }),
        );
    });

    it('treats duplicate email as success', async () => {
        insertMock.mockResolvedValue({ error: { code: '23505' } });
        const { result } = renderHook(() => useTradeFxLead());

        let res;
        await act(async () => {
            res = await result.current.submitLead(BASE_PAYLOAD);
        });

        expect(res).toEqual({ ok: true, outcome: 'duplicate' });
    });
});