import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Calendar, FileText, Gauge, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NotebookPayload, RegimeLabel } from '@/features/regime-digest/lib/types';

interface DigestSummary {
    id: string;
    year_month: string;
    subject_line: string;
    generated_at: string | null;
    notebook_payload?: NotebookPayload | null;
}

const REGIME_BADGE: Record<
    RegimeLabel,
    { label: string; icon: React.ReactNode; className: string }
> = {
    RISK_ON: {
        label: 'Risk On',
        icon: <Activity size={12} aria-hidden />,
        className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    NEUTRAL: {
        label: 'Neutral',
        icon: <Gauge size={12} aria-hidden />,
        className: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
    },
    RISK_OFF: {
        label: 'Risk Off',
        icon: <Shield size={12} aria-hidden />,
        className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
};

function formatDate(ym: string) {
    const [y, m] = ym.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function editionHref(ym: string) {
    return `/regime-digest/${ym.replace('-', '/')}`;
}

function regimeBadge(payload?: NotebookPayload | null) {
    const label = payload?.regime?.label;
    if (!label) return null;
    return REGIME_BADGE[label] ?? REGIME_BADGE.NEUTRAL;
}

function thesisLine(digest: DigestSummary): string | null {
    const fromPayload = digest.notebook_payload?.thesis?.[0]?.trim();
    if (fromPayload) return fromPayload;
    return null;
}

/** Build expected year-months from first digest to current month (inclusive). */
function expectedYearMonths(fromYm: string, toYm: string): string[] {
    const [fy, fm] = fromYm.split('-').map(Number);
    const [ty, tm] = toYm.split('-').map(Number);
    const out: string[] = [];
    let y = fy;
    let m = fm;
    while (y < ty || (y === ty && m <= tm)) {
        out.push(`${y}-${String(m).padStart(2, '0')}`);
        m += 1;
        if (m > 12) {
            m = 1;
            y += 1;
        }
    }
    return out;
}

function RegimeBadgeChip({
    payload,
    size = 'sm',
}: {
    payload?: NotebookPayload | null;
    size?: 'sm' | 'md';
}) {
    const ui = regimeBadge(payload);
    if (!ui) return null;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-widest',
                size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[10px]',
                ui.className,
            )}
        >
            {ui.icon}
            <span>{ui.label}</span>
            <span className="sr-only">regime</span>
        </span>
    );
}

export const RegimeDigestArchivePage: React.FC = () => {
    const [digests, setDigests] = useState<DigestSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDigests = async () => {
            const { data, error } = await supabase
                .from('monthly_regime_digests')
                .select('id, year_month, subject_line, generated_at, notebook_payload')
                .order('year_month', { ascending: false });

            if (!error && data) {
                // notebook_payload exists via migration; generated DB types may lag.
                setDigests(data as unknown as DigestSummary[]);
            }
            setLoading(false);
        };

        fetchDigests();
    }, []);

    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const earliest = digests.length ? digests[digests.length - 1].year_month : currentYm;
    const presentSet = new Set(digests.map((d) => d.year_month));
    const gapMonths = digests.length
        ? expectedYearMonths(earliest, currentYm).filter((ym) => !presentSet.has(ym)).reverse()
        : [];

    const latest = digests[0] ?? null;
    const rest = digests.slice(1);
    const latestThesis = latest ? thesisLine(latest) : null;
    const latestRegime = latest ? regimeBadge(latest.notebook_payload) : null;

    const seoDescription = latest
        ? [
              `Archive of GraphiQuestor Macro Regime Digests.`,
              latestRegime
                  ? `Latest: ${formatDate(latest.year_month)} · ${latestRegime.label}.`
                  : `Latest: ${formatDate(latest.year_month)}.`,
              latestThesis ?? latest.subject_line,
          ]
              .filter(Boolean)
              .join(' ')
              .slice(0, 160)
        : 'Monthly Macro Regime Digest archive — institutional desk briefs, scoreboards, and regime history from GraphiQuestor telemetry. Missing months listed explicitly.';

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title="Macro Regime Digest Archive | GraphiQuestor"
                description={seoDescription}
                canonical="https://graphiquestor.com/regime-digest/"
                robots="index, follow"
            />

            <div className="mb-10 border-b border-white/10 pb-10">
                <nav className="mb-4 text-[10px] font-mono uppercase tracking-widest text-white/25 flex items-center gap-2">
                    <Link to="/" className="hover:text-white/50 transition-colors">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="text-white/50">Regime Digest Archive</span>
                </nav>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500 mb-3">
                    GraphiQuestor Desk Product
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
                    Macro Regime
                    <br />
                    <span className="text-emerald-500">Digest Archive</span>
                </h1>
                <p className="text-sm text-muted-foreground/70 max-w-2xl leading-relaxed">
                    Monthly institutional notebook on Global Liquidity, Sovereign Stress, De-Dollarization,
                    and structural regime shifts. Desk brief, scoreboard, and automated rules — published on
                    the 1st. Missing months are listed explicitly, never silent.
                </p>
                {gapMonths.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
                            Coverage gaps ({gapMonths.length})
                        </p>
                        <p className="text-xs font-mono text-amber-200/70 leading-relaxed">
                            {gapMonths.slice(0, 12).join(' · ')}
                            {gapMonths.length > 12 ? ` · +${gapMonths.length - 12} more` : ''}
                        </p>
                    </div>
                )}
            </div>

            {loading ? (
                <Card variant="elevated" className="overflow-hidden bg-slate-950/50 backdrop-blur-md border-white/10">
                    <CardContent className="p-16 flex flex-col items-center gap-4">
                        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-muted-foreground/40 animate-pulse">
                            Loading Intelligence Archive...
                        </p>
                    </CardContent>
                </Card>
            ) : digests.length === 0 ? (
                <Card variant="elevated" className="overflow-hidden bg-slate-950/50 backdrop-blur-md border-white/10">
                    <CardContent className="p-16 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <FileText className="w-5 h-5 text-blue-500/50" />
                        </div>
                        <p className="text-sm font-bold text-white/50">No digests published yet</p>
                        <p className="text-xs text-muted-foreground/40 max-w-xs">
                            The first digest will be generated on the 1st of next month, or you can trigger one
                            from the terminal.
                        </p>
                        <Link
                            to="/"
                            className="mt-2 text-[10px] font-black tracking-widest uppercase text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Go to Terminal →
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-10">
                    {/* Featured latest edition */}
                    {latest && (
                        <Card
                            variant="elevated"
                            className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/20 border-white/10"
                        >
                            <CardContent className="p-6 sm:p-8 space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-[10px] font-black text-blue-400 tracking-widest uppercase">
                                        Latest edition
                                    </span>
                                    <RegimeBadgeChip payload={latest.notebook_payload} size="md" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                                        <Calendar size={12} className="text-emerald-400/70" />
                                        {formatDate(latest.year_month)}
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                        {latest.subject_line}
                                    </h2>
                                    {latestThesis && (
                                        <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-3xl">
                                            {latestThesis}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                        Published{' '}
                                        {latest.generated_at
                                            ? new Date(latest.generated_at).toLocaleDateString('en-US', {
                                                  day: 'numeric',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : '—'}
                                    </p>
                                </div>

                                <Link
                                    to={editionHref(latest.year_month)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    Read edition
                                    <ArrowRight size={14} aria-hidden />
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* Prior editions grid */}
                    {rest.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/40">
                                Prior editions ({rest.length})
                            </h2>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {rest.map((digest, index) => {
                                    const thesis = thesisLine(digest);
                                    return (
                                        <li key={digest.id}>
                                            <Link
                                                to={editionHref(digest.year_month)}
                                                className="group block h-full rounded-xl border border-white/10 bg-slate-950/50 backdrop-blur-md p-5 hover:bg-white/[0.03] hover:border-white/20 transition-colors"
                                            >
                                                <div className="flex flex-col gap-3 h-full">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/8 text-[11px] font-bold text-white/70">
                                                            <Calendar size={11} className="text-blue-400/70" />
                                                            {formatDate(digest.year_month)}
                                                        </div>
                                                        <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/25">
                                                            #{digests.length - 1 - index}
                                                        </span>
                                                    </div>

                                                    <RegimeBadgeChip payload={digest.notebook_payload} />

                                                    <h3 className="text-sm font-bold text-white/90 group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                                                        {digest.subject_line}
                                                    </h3>

                                                    {thesis && (
                                                        <p className="text-xs text-muted-foreground/55 leading-relaxed line-clamp-2 flex-1">
                                                            {thesis}
                                                        </p>
                                                    )}

                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400/70 group-hover:text-blue-300 mt-auto">
                                                        Read edition
                                                        <ArrowRight
                                                            size={12}
                                                            className="group-hover:translate-x-0.5 transition-transform"
                                                            aria-hidden
                                                        />
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-16 p-10 sm:p-14 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-950 border border-blue-500/10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)]" />
                <div className="relative z-10 space-y-5">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500/70">
                        Monthly Intelligence
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-tight">
                        Delivered to Your Inbox
                        <br />
                        on the 1st of Every Month
                    </h3>
                    <p className="text-sm text-slate-400/80 max-w-sm mx-auto leading-relaxed">
                        Institutional macro synthesis on Global Liquidity, Sovereign Stress, and structural
                        regime shifts.
                    </p>
                    <div className="flex justify-center flex-wrap gap-3 pt-2">
                        <Button
                            asChild
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 rounded-xl h-12"
                        >
                            <a href="https://graphiquestor.com/#newsletter">Subscribe — Free</a>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="border-white/10 rounded-xl h-12 bg-white/[0.03] hover:bg-white/[0.06]"
                        >
                            <Link to="/">Open Terminal</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <p className="mt-10 text-center text-[10px] font-bold text-muted-foreground/25 uppercase tracking-widest">
                GraphiQuestor · Institutional Macro Intelligence · Rules-based notebook
            </p>
        </div>
    );
};
