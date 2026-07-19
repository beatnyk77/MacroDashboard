import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useSubscribe, type SubscribeCadence } from '@/hooks/useSubscribe';

interface SubscribeCardProps {
    /** Records where the capture happened, for the traction breakdown. */
    source: string;
    /** 'card' = full bordered value-prop card; 'footer' = slim inline row. */
    variant?: 'card' | 'footer';
    className?: string;
}

/**
 * Regime Digest / Morning Brief capture widget.
 * Bordered value-prop card that swaps in place to a calm confirmation on submit.
 * Includes a hidden honeypot field that traps bots.
 */
export const SubscribeCard: React.FC<SubscribeCardProps> = ({ source, variant = 'card', className }) => {
    const { subscribe, status, error } = useSubscribe();
    const [email, setEmail] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [done, setDone] = useState(false);
    const [cadence, setCadence] = useState<SubscribeCadence>('weekly');

    const confirmationCopy = {
        weekly: 'Next regime digest lands this Sunday. Check your inbox to confirm your subscription.',
        daily: "Tomorrow's Morning Macro Brief arrives before the US open. Check your inbox to confirm.",
        both: 'Weekly digest + daily brief — both on your cadence. Check your inbox to confirm.',
    } as const;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await subscribe({ email, honeypot, source, cadence });
        if (result.ok) {
            setDone(true);
        }
    };

    const submitting = status === 'submitting';

    // ---- Footer variant: slim inline row -------------------------------------
    if (variant === 'footer') {
        if (done) {
            return (
                <div
                    className={`flex items-center gap-3 text-emerald-400 ${className ?? ''}`}
                    role="status"
                    aria-live="polite"
                >
                    <Check size={16} className="flex-shrink-0" aria-hidden />
                    <span className="text-xs font-black uppercase tracking-uppercase">
                        You&apos;re on the list — check your inbox to confirm.
                    </span>
                </div>
            );
        }
        return (
            <form onSubmit={handleSubmit} className={`flex flex-wrap items-end gap-2 ${className ?? ''}`} noValidate>
                <div className="min-w-[12rem] flex-1">
                    <label htmlFor={`sub-email-footer-${source}`} className="sr-only">
                        Work email
                    </label>
                    <input
                        id={`sub-email-footer-${source}`}
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@fund.com"
                        disabled={submitting}
                        className="min-h-[44px] w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                    />
                </div>
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
                    disabled={submitting}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-blue-500/20 bg-blue-500/[0.12] px-5 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-blue-400 transition-colors duration-200 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                    {submitting ? 'Joining…' : 'Join'}
                </button>
                {error ? (
                    <p role="alert" className="w-full text-[12px] text-rose-400">
                        {error}
                    </p>
                ) : null}
            </form>
        );
    }

    // ---- Card variant: full bordered value-prop card -------------------------
    if (done) {
        return (
            <div
                className={`max-w-[560px] rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-6 ${className ?? ''}`}
                role="status"
                aria-live="polite"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={20} aria-hidden />
                    </div>
                    <div>
                        <div className="mb-0.5 text-[15px] font-extrabold text-white">You&apos;re on the list.</div>
                        <div className="text-[13px] text-white/50">
                            {confirmationCopy[cadence]}
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
                De-dollarization, liquidity &amp; energy signals — synthesized from official sources. Free terminal. Choose weekly, daily, or both.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                    <label
                        htmlFor={`sub-email-${source}`}
                        className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
                    >
                        Work email
                    </label>
                    <input
                        id={`sub-email-${source}`}
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@fund.com"
                        disabled={submitting}
                        className="min-h-[44px] w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-[11px] text-[13px] text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-5 py-[11px] text-[11px] font-black uppercase tracking-uppercase text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                    {submitting ? 'Joining…' : 'Subscribe'}
                </button>
            </div>
            {error ? (
                <p role="alert" className="mt-2 text-[12px] text-rose-400">
                    {error}
                </p>
            ) : null}
            <fieldset className="mt-4 space-y-2">
                <legend className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                    Email cadence
                </legend>
                {([
                    { value: 'weekly' as const, label: 'Weekly Regime Digest', hint: 'Sundays — regime synthesis' },
                    { value: 'daily' as const, label: 'Daily Morning Brief', hint: 'Weekdays — overnight signal' },
                    { value: 'both' as const, label: 'Both', hint: 'Full macro coverage' },
                ]).map((opt) => (
                    <label
                        key={opt.value}
                        className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[12px] text-white/60 transition-colors duration-200 hover:border-white/12"
                    >
                        <input
                            type="radio"
                            name={`cadence-${source}`}
                            checked={cadence === opt.value}
                            onChange={() => setCadence(opt.value)}
                            className="mt-1 accent-blue-600"
                        />
                        <span>
                            <span className="block font-bold text-white/80">{opt.label}</span>
                            <span className="text-[11px] text-white/40">{opt.hint}</span>
                        </span>
                    </label>
                ))}
            </fieldset>
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
                Stored in Supabase · insert-only RLS · double opt-in · free forever terminal
            </div>
        </form>
    );
};

export default SubscribeCard;
