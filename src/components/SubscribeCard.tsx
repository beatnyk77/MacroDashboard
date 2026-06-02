import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useSubscribe } from '@/hooks/useSubscribe';

interface SubscribeCardProps {
    /** Records where the capture happened, for the traction breakdown. */
    source: string;
    /** 'card' = full bordered value-prop card; 'footer' = slim inline row. */
    variant?: 'card' | 'footer';
    className?: string;
}

/**
 * Weekly Regime Digest capture widget (plan decisions D2 / D9 / D11 / D13).
 * Bordered value-prop card that swaps in place to a calm confirmation on submit.
 * Includes a hidden honeypot field that traps bots.
 */
export const SubscribeCard: React.FC<SubscribeCardProps> = ({ source, variant = 'card', className }) => {
    const { subscribe, status } = useSubscribe();
    const [email, setEmail] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await subscribe({ email, honeypot, source });
        if (result.ok) {
            // Confirmation swap covers genuine, duplicate and bot-trapped submissions alike.
            setDone(true);
        }
    };

    // ---- Footer variant: slim inline row -------------------------------------
    if (variant === 'footer') {
        if (done) {
            return (
                <div className={`flex items-center gap-3 text-emerald-400 ${className ?? ''}`}>
                    <Check size={16} className="flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-uppercase">
                        You&apos;re on the list — check your inbox to confirm.
                    </span>
                </div>
            );
        }
        return (
            <form onSubmit={handleSubmit} className={`flex gap-2 ${className ?? ''}`} noValidate>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@fund.com"
                    aria-label="Email address (footer)"
                    className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
                />
                {/* Honeypot — hidden from humans, traps bots */}
                <input
                    type="text"
                    name="company_website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="absolute -left-[9999px] h-px w-px opacity-0"
                />
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="rounded-[10px] border border-blue-500/20 bg-blue-500/[0.12] px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                >
                    Join
                </button>
            </form>
        );
    }

    // ---- Card variant: full bordered value-prop card -------------------------
    if (done) {
        return (
            <div className={`max-w-[560px] rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-6 ${className ?? ''}`}>
                <div className="flex items-center gap-4">
                    <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={20} />
                    </div>
                    <div>
                        <div className="mb-0.5 text-[15px] font-extrabold text-white">You&apos;re on the list.</div>
                        <div className="text-[13px] text-white/50">
                            Next regime digest lands this Sunday. Check your inbox to confirm your subscription.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={`max-w-[560px] rounded-[18px] border border-blue-500/20 bg-blue-500/[0.04] p-6 ${className ?? ''}`}
            noValidate
        >
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-400/80">
                Macro Strategy Division
            </div>
            <h4 className="mb-1.5 text-[18px] font-extrabold text-white">Get the Weekly Regime Digest</h4>
            <p className="mb-4 text-[13px] leading-relaxed text-white/50">
                De-dollarization, liquidity &amp; energy signals — synthesized from 15+ official sources. No noise.
            </p>
            <div className="flex gap-2">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@fund.com"
                    aria-label="Email address"
                    className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-[11px] text-[13px] text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="rounded-[10px] bg-blue-600 px-5 py-[11px] text-[11px] font-black uppercase tracking-uppercase text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                    {status === 'submitting' ? 'Joining…' : 'Subscribe'}
                </button>
            </div>
            {/* Honeypot — hidden from humans, traps bots */}
            <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] h-px w-px opacity-0"
            />
            <div className="mt-2.5 text-[10px] tracking-[0.04em] text-white/30">
                Stored in Supabase · insert-only RLS · double opt-in
            </div>
        </form>
    );
};

export default SubscribeCard;
