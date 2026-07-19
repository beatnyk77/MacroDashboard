import React, { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/hooks/useSubscribe';

interface ExportScoutLeadCardProps {
    hsCode: string;
    playbookPath: string;
}

/**
 * Optional lead capture after free Export Scout playbook.
 * Never blocks reading the playbook — conversion only.
 */
export const ExportScoutLeadCard: React.FC<ExportScoutLeadCardProps> = ({
    hsCode,
    playbookPath,
}) => {
    const [email, setEmail] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            setStatus('error');
            setError('Enter a valid email address.');
            return;
        }
        setStatus('submitting');
        setError(null);
        try {
            const { data, error: invErr } = await supabase.functions.invoke('growth-actions', {
                body: {
                    task: 'scout-lead',
                    email: email.trim().toLowerCase(),
                    hs_code: hsCode,
                    playbook_path: playbookPath,
                    source: 'export-scout',
                    honeypot,
                },
            });
            if (invErr) throw invErr;
            if (data && typeof data === 'object' && 'error' in data && data.error) {
                throw new Error(String(data.error));
            }
            setStatus('done');
        } catch {
            setStatus('error');
            setError('Could not send. Try again or copy the page URL.');
        }
    };

    if (status === 'done') {
        return (
            <div
                className="rounded-[18px] border border-emerald-400/25 bg-emerald-500/[0.06] p-6"
                role="status"
                aria-live="polite"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                        <Check size={20} aria-hidden />
                    </div>
                    <div>
                        <div className="text-[15px] font-extrabold text-white">Check your inbox</div>
                        <p className="text-[13px] text-white/50">
                            We sent a link to this free playbook. Terminal and scout stay free.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-[18px] border border-blue-500/20 bg-blue-500/[0.04] p-6"
            noValidate
        >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-400/80">
                <Mail size={14} aria-hidden />
                Optional · free
            </div>
            <h3 className="mb-1.5 text-[16px] font-extrabold text-white">
                Email me this playbook
            </h3>
            <p className="mb-4 text-[13px] leading-relaxed text-white/50">
                Get a durable link to this HS{hsCode ? ` ${hsCode}` : ''} Export Scout synthesis.
                Does not gate the playbook above — capture only.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                    <label
                        htmlFor="scout-lead-email"
                        className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-white/35"
                    >
                        Work email
                    </label>
                    <input
                        id="scout-lead-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@exporter.com"
                        disabled={status === 'submitting'}
                        className="min-h-[44px] w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3.5 py-[11px] text-[13px] text-white placeholder:text-white/30 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-5 py-[11px] text-[11px] font-black uppercase tracking-uppercase text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {status === 'submitting' ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : null}
                    {status === 'submitting' ? 'Sending…' : 'Send link'}
                </button>
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
            {error ? (
                <p role="alert" className="mt-2 text-[12px] text-rose-400">
                    {error}
                </p>
            ) : null}
        </form>
    );
};
