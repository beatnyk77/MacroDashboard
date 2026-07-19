import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';

type ConfirmState = 'confirming' | 'confirmed' | 'invalid';

export const SubscribeConfirm: React.FC = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [state, setState] = useState<ConfirmState>('confirming');

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!token) {
                setState('invalid');
                return;
            }
            const { data, error } = await supabase.rpc('confirm_subscription', { p_token: token });
            if (cancelled) return;
            // RPC returns 'confirmed' | 'invalid' (and may return 'already_confirmed' if extended later).
            if (!error && (data === 'confirmed' || data === 'already_confirmed')) {
                setState('confirmed');
            } else {
                setState('invalid');
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
            <SEOManager
                title="Confirm Your Subscription"
                description="Confirm your subscription to GraphiQuestor email digests."
                robots="noindex, nofollow"
                canonical="https://graphiquestor.com/subscribe/confirm/"
            />

            <div className="mb-8 text-[10px] font-black uppercase tracking-[0.22em] text-blue-400/80">
                GraphiQuestor · Email
            </div>

            {state === 'confirming' && (
                <div role="status" aria-live="polite" className="flex flex-col items-center">
                    <Loader2 size={40} className="mb-6 animate-spin text-blue-400" aria-hidden />
                    <h1 className="text-[22px] font-extrabold text-white">Confirming your subscription…</h1>
                    <p className="mt-2 text-[13px] text-white/45">This only takes a moment.</p>
                </div>
            )}

            {state === 'confirmed' && (
                <div
                    className="w-full rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-8"
                    role="status"
                    aria-live="polite"
                >
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={22} aria-hidden />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">You&apos;re confirmed.</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        Your GraphiQuestor email is active — weekly regime digest, daily morning brief, or both,
                        per the cadence you chose. The free terminal stays open.
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
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">Link already used or expired.</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        This confirmation link may already have been used (you&apos;re likely on the list),
                        or it expired. Check your inbox for the daily brief or weekly digest — or re-subscribe
                        for a fresh link.
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

export default SubscribeConfirm;
