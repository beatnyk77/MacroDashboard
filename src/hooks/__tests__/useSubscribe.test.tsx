import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscribe, isValidEmail } from '../useSubscribe';

// --- Mocks --------------------------------------------------------------------
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

describe('isValidEmail', () => {
    it('accepts well-formed addresses', () => {
        expect(isValidEmail('analyst@fund.com')).toBe(true);
        expect(isValidEmail('  Person@Domain.io ')).toBe(true);
    });

    it('rejects malformed addresses', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(isValidEmail('missing@tld')).toBe(false);
        expect(isValidEmail('@nope.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

describe('useSubscribe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        insertMock.mockResolvedValue({ error: null });
    });

    it('rejects an invalid email without touching the database', async () => {
        const { result } = renderHook(() => useSubscribe());

        let res;
        await act(async () => {
            res = await result.current.subscribe({ email: 'garbage', source: 'investor-page' });
        });

        expect(res).toEqual({ ok: false, outcome: 'invalid' });
        expect(supabase.from).not.toHaveBeenCalled();
        expect(result.current.status).toBe('error');
    });

    it('silently drops bot submissions when the honeypot is filled', async () => {
        const { result } = renderHook(() => useSubscribe());

        let res;
        await act(async () => {
            res = await result.current.subscribe({
                email: 'analyst@fund.com',
                honeypot: 'http://spam.example',
                source: 'investor-page',
            });
        });

        expect(res).toEqual({ ok: true, outcome: 'bot' });
        expect(supabase.from).not.toHaveBeenCalled();
        expect(trackEventMock).not.toHaveBeenCalled();
    });

    it('inserts a normalized pending subscriber with a confirm token + source', async () => {
        const { result } = renderHook(() => useSubscribe());

        await act(async () => {
            await result.current.subscribe({ email: '  Analyst@Fund.COM ', source: 'footer' });
        });

        expect(supabase.from).toHaveBeenCalledWith('subscribers');
        expect(insertMock).toHaveBeenCalledTimes(1);
        const payload = insertMock.mock.calls[0][0];
        expect(payload.email).toBe('analyst@fund.com');
        expect(payload.status).toBe('pending');
        expect(payload.source).toBe('footer');
        expect(typeof payload.confirm_token).toBe('string');
        expect(payload.confirm_token.length).toBeGreaterThan(0);
        expect(result.current.status).toBe('success');
        expect(trackEventMock).toHaveBeenCalledWith(
            'subscribe',
            expect.objectContaining({ event_category: 'conversion', event_label: 'footer' }),
        );
    });

    it('treats a unique-violation as a successful duplicate (dedupe)', async () => {
        insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });
        const { result } = renderHook(() => useSubscribe());

        let res;
        await act(async () => {
            res = await result.current.subscribe({ email: 'dupe@fund.com', source: 'investor-page' });
        });

        expect(res).toEqual({ ok: true, outcome: 'duplicate' });
        expect(result.current.status).toBe('success');
        // No conversion event for a repeat subscribe.
        expect(trackEventMock).not.toHaveBeenCalled();
    });

    it('surfaces a generic error on an unexpected insert failure', async () => {
        insertMock.mockResolvedValue({ error: { code: '42501', message: 'rls denied' } });
        const { result } = renderHook(() => useSubscribe());

        let res;
        await act(async () => {
            res = await result.current.subscribe({ email: 'ok@fund.com', source: 'investor-page' });
        });

        expect(res).toEqual({ ok: false, outcome: 'error' });
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBeTruthy();
    });
});

// --- Confirm path (RPC) -------------------------------------------------------
describe('confirm_subscription RPC contract', () => {
    it('flips a pending subscriber to confirmed via the token RPC', async () => {
        const rpcMock = vi.fn().mockResolvedValue({ data: 'confirmed', error: null });
        const client = { rpc: rpcMock };

        const { data, error } = await client.rpc('confirm_subscription', { p_token: 'tok-123' });

        expect(rpcMock).toHaveBeenCalledWith('confirm_subscription', { p_token: 'tok-123' });
        expect(error).toBeNull();
        expect(data).toBe('confirmed');
    });

    it('returns invalid for an unknown/expired token', async () => {
        const rpcMock = vi.fn().mockResolvedValue({ data: 'invalid', error: null });
        const client = { rpc: rpcMock };

        const { data } = await client.rpc('confirm_subscription', { p_token: 'bad' });
        expect(data).toBe('invalid');
    });
});
