import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';

type ManageState = 'working' | 'done' | 'invalid';

/** Keys match manage_subscription() return values. */
const ACTION_LABELS: Record<string, string> = {
    unsubscribe: 'You have been unsubscribed.',
    unsubscribed: 'You have been unsubscribed.',
    weekly: 'Cadence updated — weekly digest only.',
    daily: 'Cadence updated — daily brief only.',
    both: 'Cadence updated — daily brief + weekly digest.',
};

/**
 * /subscribe/manage/?token=…&action=…
 * Token-based, no-auth subscription management for email footer links.
 * Actions: unsubscribe | cadence_weekly | cadence_daily | cadence_both
 */
export const ManageSubscription: React.FC = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const action = params.get('action');
    const [state, setState] = useState<ManageState>('working');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!token || !action) {
                setState('invalid');
                return;
            }
            const { data, error } = await supabase.rpc('manage_subscription', {
                p_token: token,
                p_action: action,
            });
            if (cancelled) return;
            if (!error && data && data !== 'invalid') {
                setMessage(ACTION_LABELS[String(data)] ?? 'Subscription updated.');
                setState('done');
            } else {
                setState('invalid');
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [token, action]);

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
            <SEOManager
                title="Manage Subscription"
                description="Manage your GraphiQuestor email subscription."
                robots="noindex, nofollow"
                canonical="https://graphiquestor.com/subscribe/manage/"
            />

            <div className="mb-8 text-[10px] font-black uppercase tracking-[0.22em] text-blue-400/80">
                GraphiQuestor · Email
            </div>

            {state === 'working' && (
                <div role="status" aria-live="polite" className="flex flex-col items-center">
                    <Loader2 size={40} className="mb-6 animate-spin text-blue-400" aria-hidden />
                    <h1 className="text-[22px] font-extrabold text-white">Updating your subscription…</h1>
                </div>
            )}

            {state === 'done' && (
                <div
                    className="w-full rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-8"
                    role="status"
                    aria-live="polite"
                >
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={22} aria-hidden />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">{message}</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        Changed your mind? Every email footer has links to adjust cadence or re-subscribe —
                        or head back to the free terminal.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-blue-500/20 bg-blue-500/[0.12] px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-blue-400 transition-colors hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                        Open the free terminal
                    </Link>
                </div>
            )}

            {state === 'invalid' && (
                <div
                    className="w-full rounded-[18px] border border-amber-400/25 bg-amber-500/[0.06] p-8"
                    role="alert"
                >
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
                        <AlertTriangle size={22} aria-hidden />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">Link expired or invalid.</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        We couldn&apos;t apply that change. Use the footer link from your most recent email,
                        or re-subscribe for a fresh confirmation link.
                    </p>
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link
                            to="/institutional/"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            Re-subscribe
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-white/15 px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-white/70 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                            Open terminal
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubscription;
