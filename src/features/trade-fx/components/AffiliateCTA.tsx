import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTradeFxLead } from '../hooks/useTradeFxLead';
import {
    scrollToAffiliateCta,
    TRADE_FX_AFFILIATE_CTA_ID,
} from '../lib/hedgingArchetypes';
import type { CurrencyPair, Role, TradeFxLeadPayload } from '../lib/tradeFxTypes';

const PARTNERS = [
    { id: 'hdfc' as const, label: 'HDFC Forex Desk' },
    { id: 'kotak' as const, label: 'Kotak FX' },
    { id: 'icici' as const, label: 'ICICI FX' },
    { id: 'skydo' as const, label: 'Skydo' },
    { id: 'karbon' as const, label: 'Karbon' },
    { id: 'any' as const, label: 'No preference' },
];

const NOTIONAL_RANGES: { id: TradeFxLeadPayload['notionalRange']; label: string }[] = [
    { id: '<1Cr', label: '< ₹1 Cr' },
    { id: '1-5Cr', label: '₹1–5 Cr' },
    { id: '5-25Cr', label: '₹5–25 Cr' },
    { id: '>25Cr', label: '> ₹25 Cr' },
];

const INTEREST_TYPES: { id: TradeFxLeadPayload['interestType']; label: string }[] = [
    { id: 'forward', label: 'Forward contract' },
    { id: 'collar', label: 'Collar / structured product' },
    { id: 'options', label: 'Options' },
    { id: 'inr_invoicing', label: 'INR invoicing support' },
    { id: 'general', label: 'General FX advisory' },
];

const ROLE_OPTIONS: { id: Role; label: string }[] = [
    { id: 'exporter', label: 'Exporter' },
    { id: 'importer', label: 'Importer' },
    { id: 'balanced', label: 'Both' },
];

const CONFIRMATION_MESSAGE =
    'Your interest has been logged. A GraphiQuestor partner will be in touch within 2 business days.';

const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-[#B8860B]/40 focus:outline-none';

const selectClass =
    'w-full rounded-lg border border-white/10 bg-[#0D0D0D] px-3 py-2.5 text-[13px] text-white focus:border-[#B8860B]/40 focus:outline-none';

interface AffiliateCTAProps {
    role: Role;
    pair: CurrencyPair;
    className?: string;
}

export const AffiliateCTA: React.FC<AffiliateCTAProps> = ({ role, pair, className }) => {
    const [done, setDone] = useState(false);

    return (
        <>
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[#0D0D0D]/95 backdrop-blur-sm px-4 py-3">
                <button
                    type="button"
                    onClick={scrollToAffiliateCta}
                    className="w-full px-4 py-3 rounded-xl border border-[#B8860B]/40 bg-[#B8860B]/15 text-[11px] font-black uppercase tracking-wider text-[#B8860B]"
                >
                    Request Partner Intro
                </button>
            </div>

            <section
                id={TRADE_FX_AFFILIATE_CTA_ID}
                className={cn(
                    'scroll-mt-28 border border-white/10 bg-white/[0.02] rounded-2xl p-4 md:p-6 space-y-5',
                    className,
                )}
            >
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-1">
                        Partner Referral
                    </h2>
                    <p className="text-[11px] text-white/40 m-0 leading-relaxed">
                        Request indicative pricing or a treasury desk introduction via GraphiQuestor&apos;s
                        preferred partner network. Educational referral only — not a product application.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['Skydo', 'Karbon', 'HDFC', 'Kotak', 'ICICI'].map((partner) => (
                        <span
                            key={partner}
                            className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] text-white/45"
                        >
                            {partner}
                        </span>
                    ))}
                </div>
                <p className="text-[10px] text-white/30 m-0 italic">
                    Preferred Partner Network — Independently selected for quality and reliability
                </p>

                {done ? (
                    <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] px-5 py-4 flex items-start gap-3">
                        <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                        <p className="text-sm text-emerald-200/90 m-0 leading-relaxed">
                            {CONFIRMATION_MESSAGE}
                        </p>
                    </div>
                ) : (
                    <AffiliateCTAForm
                        key={`${role}-${pair}`}
                        role={role}
                        pair={pair}
                        onSuccess={() => setDone(true)}
                    />
                )}
            </section>
        </>
    );
};

const AffiliateCTAForm: React.FC<{
    role: Role;
    pair: CurrencyPair;
    onSuccess: () => void;
}> = ({ role, pair, onSuccess }) => {
    const { submitLead, status, error } = useTradeFxLead();

    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [tradeRole, setTradeRole] = useState<Role>(role);
    const [currencyPair, setCurrencyPair] = useState<CurrencyPair>(pair);
    const [notionalRange, setNotionalRange] =
        useState<TradeFxLeadPayload['notionalRange']>('1-5Cr');
    const [partnerPreference, setPartnerPreference] =
        useState<TradeFxLeadPayload['partnerPreference']>('any');
    const [interestType, setInterestType] =
        useState<TradeFxLeadPayload['interestType']>('general');
    const [honeypot, setHoneypot] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await submitLead({
            contactName,
            email,
            tradeRole,
            currencyPair,
            notionalRange,
            partnerPreference,
            interestType,
            honeypot,
        });
        if (result.ok) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name">
                    <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Your name"
                        className={inputClass}
                    />
                </Field>
                <Field label="Business email">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={inputClass}
                    />
                </Field>
                <Field label="Role">
                    <select
                        value={tradeRole}
                        onChange={(e) => setTradeRole(e.target.value as Role)}
                        className={selectClass}
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Currency pair">
                    <select
                        value={currencyPair}
                        onChange={(e) => setCurrencyPair(e.target.value as CurrencyPair)}
                        className={selectClass}
                    >
                        <option value="USD/INR">USD/INR</option>
                        <option value="EUR/INR">EUR/INR</option>
                        <option value="CNY/INR">CNY/INR</option>
                    </select>
                </Field>
                <Field label="Notional range">
                    <select
                        value={notionalRange}
                        onChange={(e) =>
                            setNotionalRange(
                                e.target.value as TradeFxLeadPayload['notionalRange'],
                            )
                        }
                        className={selectClass}
                    >
                        {NOTIONAL_RANGES.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Partner preference">
                    <select
                        value={partnerPreference}
                        onChange={(e) =>
                            setPartnerPreference(
                                e.target.value as TradeFxLeadPayload['partnerPreference'],
                            )
                        }
                        className={selectClass}
                    >
                        {PARTNERS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Interest type" className="md:col-span-2">
                    <select
                        value={interestType}
                        onChange={(e) =>
                            setInterestType(
                                e.target.value as TradeFxLeadPayload['interestType'],
                            )
                        }
                        className={selectClass}
                    >
                        {INTEREST_TYPES.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </Field>
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

            <p className="text-[10px] text-white/40 leading-relaxed m-0">
                By submitting, you consent to GraphiQuestor sharing your contact details with
                the selected partner institution for the purpose of discussing currency management
                solutions. This is not an application for financial products.{' '}
                <Link to="/privacy" className="text-[#B8860B]/80 hover:text-[#B8860B] underline">
                    View our privacy policy
                </Link>
                .
            </p>

            {error ? (
                <p className="text-xs text-rose-400 m-0" role="alert">
                    {error}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full md:w-auto px-6 py-3 rounded-xl border border-[#B8860B]/40 bg-[#B8860B]/15 text-[11px] font-black uppercase tracking-wider text-[#B8860B] hover:bg-[#B8860B]/25 transition-colors disabled:opacity-50"
            >
                {status === 'submitting' ? 'Submitting…' : 'Submit referral request'}
            </button>
        </form>
    );
};

const Field: React.FC<{
    label: string;
    children: React.ReactNode;
    className?: string;
}> = ({ label, children, className }) => (
    <label className={cn('block space-y-1.5', className)}>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
            {label}
        </span>
        {children}
    </label>
);