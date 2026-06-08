import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

export type SubscribeStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface SubscribeArgs {
    email: string;
    /** Hidden honeypot field value — if populated, the submission is a bot and is silently dropped. */
    honeypot?: string;
    /** Where the capture happened (e.g. 'investor-page', 'footer'). */
    source?: string;
}

export interface SubscribeResult {
    ok: boolean;
    /** 'subscribed' = new pending row, 'duplicate' = already on the list, 'bot' = honeypot tripped, 'invalid' = bad email, 'error' = insert failed. */
    outcome: 'subscribed' | 'duplicate' | 'bot' | 'invalid' | 'error';
}

// Pragmatic email shape check — deliverability is enforced by the double opt-in step.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean =>
    EMAIL_RE.test(email.trim());

const generateToken = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID.
    return `tok_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

/**
 * Capture hook for the Weekly Regime Digest.
 * Validates the email, drops bot submissions (honeypot), inserts a `pending`
 * subscriber via the insert-only RLS policy, and treats unique-violations as a
 * (successful) duplicate so the user never sees a scary error for re-subscribing.
 * Fires a GA4 conversion event on a genuinely new capture.
 */
export function useSubscribe() {
    const [status, setStatus] = useState<SubscribeStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    const subscribe = useCallback(async ({ email, honeypot, source }: SubscribeArgs): Promise<SubscribeResult> => {
        // 1. Honeypot — a filled hidden field means a bot; silently succeed without writing.
        if (honeypot && honeypot.trim().length > 0) {
            return { ok: true, outcome: 'bot' };
        }

        // 2. Validate.
        const cleanedEmail = email.trim().toLowerCase();
        if (!isValidEmail(cleanedEmail)) {
            setStatus('error');
            setError('Enter a valid email address.');
            return { ok: false, outcome: 'invalid' };
        }

        setStatus('submitting');
        setError(null);

        // 3. Insert pending subscriber.
        const confirmToken = generateToken();
        const { error: insertError } = await supabase
            .from('subscribers')
            .insert({
                email: cleanedEmail,
                status: 'pending',
                confirm_token: confirmToken,
                source: source ?? 'unknown',
            });

        if (insertError) {
            // 23505 = unique_violation → already subscribed. Treat as success (dedupe).
            if (insertError.code === '23505') {
                setStatus('success');
                return { ok: true, outcome: 'duplicate' };
            }
            setStatus('error');
            setError('Something went wrong. Please try again.');
            return { ok: false, outcome: 'error' };
        }

        // 4. Send the double opt-in confirmation email.
        try {
            await supabase.functions.invoke('send-confirm-email', {
                body: { email: cleanedEmail, token: confirmToken },
            });
        } catch (emailErr) {
            // Non-fatal: the subscriber row is already written. Log and continue.
            console.warn('[useSubscribe] confirmation email failed to send:', emailErr);
        }

        // 5. New capture — fire the GA4 conversion event.
        trackEvent('subscribe', {
            event_category: 'conversion',
            event_label: source ?? 'unknown',
        });

        setStatus('success');
        return { ok: true, outcome: 'subscribed' };
    }, []);

    return { subscribe, status, error, reset };
}
