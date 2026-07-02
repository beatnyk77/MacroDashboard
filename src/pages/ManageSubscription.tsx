import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';

type ManageState = 'working' | 'done' | 'invalid';

const ACTION_LABELS: Record<string, string> = {
    unsubscribe: 'You have been unsubscribed.',
    weekly: 'Cadence updated — weekly digest only.',
    daily: 'Cadence updated — daily brief only.',
    both: 'Cadence updated — daily brief + weekly digest.',
};

/**
 * /subscribe/manage?token=…&action=…
 * Token-based, no-auth subscription management target for email footer links.
 * Actions: unsubscribe | cadence_weekly | cadence_daily | cadence_both
 * (see manage_subscription() SECURITY DEFINER function).
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
                setMessage(ACTION_LABELS[data as string] ?? 'Subscription updated.');
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
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-32 text-center">
            <SEOManager
                title="Manage Subscription"
                description="Manage your GraphiQuestor email subscription."
                robots="noindex, nofollow"
            />

            {state === 'working' && (
                <>
                    <Loader2 size={40} className="mb-6 animate-spin text-blue-400" />
                    <h1 className="text-[22px] font-extrabold text-white">Updating your subscription…</h1>
                </>
            )}

            {state === 'done' && (
                <div className="w-full rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-8">
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={22} />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">{message}</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        Changed your mind? Every email footer has links to adjust cadence or re-subscribe —
                        or head back to the terminal.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-[10px] border border-blue-500/20 bg-blue-500/[0.12] px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-blue-400 transition-colors hover:bg-blue-500/20"
                    >
                        Open the macro terminal
                    </Link>
                </div>
            )}

            {state === 'invalid' && (
                <div className="w-full rounded-[18px] border border-amber-400/25 bg-amber-500/[0.06] p-8">
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
                        <AlertTriangle size={22} />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">Link expired or invalid.</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        We couldn&apos;t apply that change. The link may be malformed or already used.
                        Use the footer link from your most recent email, or re-subscribe below.
                    </p>
                    <Link
                        to="/institutional"
                        className="inline-flex items-center gap-2 rounded-[10px] bg-blue-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-white transition-colors hover:bg-blue-700"
                    >
                        Back to the investor page
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ManageSubscription;
