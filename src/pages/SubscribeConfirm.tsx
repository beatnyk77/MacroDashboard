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
            setState(!error && data === 'confirmed' ? 'confirmed' : 'invalid');
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-32 text-center">
            <SEOManager
                title="Confirm Your Subscription"
                description="Confirm your subscription to the GraphiQuestor Weekly Regime Digest."
                robots="noindex, nofollow"
            />

            {state === 'confirming' && (
                <>
                    <Loader2 size={40} className="mb-6 animate-spin text-blue-400" />
                    <h1 className="text-[22px] font-extrabold text-white">Confirming…</h1>
                </>
            )}

            {state === 'confirmed' && (
                <div className="w-full rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-8">
                    <div className="mx-auto mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={22} />
                    </div>
                    <h1 className="mb-2 text-[20px] font-extrabold text-white">You&apos;re confirmed.</h1>
                    <p className="mb-6 text-[14px] leading-relaxed text-white/50">
                        Your subscription to the Weekly Regime Digest is active. The next edition lands this Sunday.
                    </p>
                    <Link
                        to="/data-health"
                        className="inline-flex items-center gap-2 rounded-[10px] border border-blue-500/20 bg-blue-500/[0.12] px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-blue-400 transition-colors hover:bg-blue-500/20"
                    >
                        Explore the live data-health board
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
                        We couldn&apos;t confirm that link. It may have already been used. Re-subscribe from the investor page to get a fresh confirmation.
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

export default SubscribeConfirm;
