import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';
import { isValidEmail } from '@/hooks/useSubscribe';
import type { TradeFxLeadPayload } from '../lib/tradeFxTypes';

export type TradeFxLeadStatus = 'idle' | 'submitting' | 'success' | 'error';

export type TradeFxLeadOutcome =
    | 'submitted'
    | 'duplicate'
    | 'bot'
    | 'invalid'
    | 'error';

export interface TradeFxLeadResult {
    ok: boolean;
    outcome: TradeFxLeadOutcome;
}

const generateToken = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `tok_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

function resolveLeadType(partner: TradeFxLeadPayload['partnerPreference']): string {
    if (partner === 'skydo') return 'trade_fx_skydo';
    return 'trade_fx_bank_referral';
}

/**
 * Captures TradeFx affiliate referral leads into the existing subscribers table.
 * No confirmation email — partner follow-up is post-MVP via pg_cron notification.
 */
export function useTradeFxLead() {
    const [status, setStatus] = useState<TradeFxLeadStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    const submitLead = useCallback(
        async (payload: TradeFxLeadPayload): Promise<TradeFxLeadResult> => {
            if (payload.honeypot && payload.honeypot.trim().length > 0) {
                return { ok: true, outcome: 'bot' };
            }

            const contactName = payload.contactName.trim();
            const cleanedEmail = payload.email.trim().toLowerCase();

            if (!contactName) {
                setStatus('error');
                setError('Enter your name.');
                return { ok: false, outcome: 'invalid' };
            }

            if (!isValidEmail(cleanedEmail)) {
                setStatus('error');
                setError('Enter a valid business email address.');
                return { ok: false, outcome: 'invalid' };
            }

            setStatus('submitting');
            setError(null);

            const { error: insertError } = await supabase.from('subscribers').insert({
                email: cleanedEmail,
                status: 'pending',
                confirm_token: generateToken(),
                source: 'trade_fx',
                contact_name: contactName,
                lead_type: resolveLeadType(payload.partnerPreference),
                trade_role: payload.tradeRole,
                currency_pair: payload.currencyPair,
                notional_range: payload.notionalRange,
                partner_preference: payload.partnerPreference,
                interest_type: payload.interestType,
            });

            if (insertError) {
                if (insertError.code === '23505') {
                    setStatus('success');
                    return { ok: true, outcome: 'duplicate' };
                }
                setStatus('error');
                setError('Something went wrong. Please try again.');
                return { ok: false, outcome: 'error' };
            }

            trackEvent('trade_fx_lead', {
                event_category: 'conversion',
                event_label: payload.partnerPreference,
                interest_type: payload.interestType,
                trade_role: payload.tradeRole,
            });

            setStatus('success');
            return { ok: true, outcome: 'submitted' };
        },
        [],
    );

    return { submitLead, status, error, reset };
}