import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { ArrowLeft, ChevronRight, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useRegimeDigest, MetricsSnapshot } from '@/features/regime-digest/hooks/useRegimeDigest';
import { useIngestionHealth } from '@/features/daily-macro/hooks/useIngestionHealth';
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip';
import { RelatedContent } from '@/components/RelatedContent';
import { format } from 'date-fns';

// ── Metric pill ──────────────────────────────────────────────────────────────

interface MetricPillProps {
    label: string;
    value: string;
    sub?: string;
    trend?: 'up' | 'down' | 'flat';
}

const MetricPill: React.FC<MetricPillProps> = ({ label, value, sub, trend }) => {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';
    return (
        <div className="flex flex-col gap-1 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] min-w-0">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 whitespace-nowrap">{label}</span>
            <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-white tracking-tight leading-none">{value}</span>
                {trend && <TrendIcon size={11} className={trendColor} />}
            </div>
            {sub && <span className="text-[9px] font-bold text-muted-foreground/30 whitespace-nowrap">{sub}</span>}
        </div>
    );
};

// ── Metrics strip ─────────────────────────────────────────────────────────────

const MetricsStrip: React.FC<{ snapshot: MetricsSnapshot }> = ({ snapshot }) => {
    const fmt = (v?: number, decimals = 1) => (v != null ? v.toFixed(decimals) : '—');

    const dxyTrend = snapshot.us?.dxy != null && snapshot.us?.dxy_prev != null
        ? snapshot.us.dxy > snapshot.us.dxy_prev ? 'up' : 'down'
        : 'flat' as const;

    const goldTrend = snapshot.commodities?.gold_usd != null && snapshot.commodities?.gold_prev != null
        ? snapshot.commodities.gold_usd > snapshot.commodities.gold_prev ? 'up' : 'down'
        : 'flat' as const;

    const brentTrend = snapshot.commodities?.brent_crude != null && snapshot.commodities?.brent_prev != null
        ? snapshot.commodities.brent_crude > snapshot.commodities.brent_prev ? 'up' : 'down'
        : 'flat' as const;

    // Six primary vitals — ordered by CIO scan priority, all fit in one row at max-w-5xl
    const vitals: Array<{ label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'flat' }> = [];
    if (snapshot.us?.dxy != null)
        vitals.push({ label: 'DXY', value: fmt(snapshot.us.dxy), trend: dxyTrend });
    if (snapshot.commodities?.gold_usd != null)
        vitals.push({ label: 'Gold', value: `$${Math.round(snapshot.commodities.gold_usd).toLocaleString()}`, trend: goldTrend });
    if (snapshot.commodities?.brent_crude != null)
        vitals.push({ label: 'Brent', value: `$${fmt(snapshot.commodities.brent_crude)}`, trend: brentTrend });
    if (snapshot.us?.vix != null)
        vitals.push({ label: 'VIX', value: fmt(snapshot.us.vix), sub: snapshot.us.vix > 20 ? 'Elevated' : 'Contained' });
    if (snapshot.us?.debt_gold_ratio != null)
        vitals.push({ label: 'Debt/Gold', value: `${fmt(snapshot.us.debt_gold_ratio)}x`, sub: 'Fiscal Stress' });
    if (snapshot.india?.gdp_yoy != null)
        vitals.push({ label: 'India GDP', value: `${fmt(snapshot.india.gdp_yoy)}%`, sub: 'YoY' });
    else if (snapshot.china?.gdp_yoy != null)
        vitals.push({ label: 'China GDP', value: `${fmt(snapshot.china.gdp_yoy)}%`, sub: 'YoY' });

    if (vitals.length === 0) return null;

    return (
        <div className="mb-10 pb-10 border-b border-white/5">
            <p className="text-[9px] font-black tracking-[0.25em] uppercase text-muted-foreground/30 mb-3">
                Macro Vitals · Snapshot
            </p>
            <div className="flex flex-wrap gap-2">
                {vitals.map(v => (
                    <MetricPill key={v.label} label={v.label} value={v.value} sub={v.sub} trend={v.trend} />
                ))}
            </div>
        </div>
    );
};

// ── Main content ──────────────────────────────────────────────────────────────

const RegimeDigestContent: React.FC = () => {
    const { year, month } = useParams<{ year: string; month: string }>();
    const { data: digest, isLoading, error, regenerate, isRegenerating } = useRegimeDigest(year, month);
    const { data: health } = useIngestionHealth();

    const jobHealth = health?.find(h => h.job_name === 'generate-monthly-regime-digest');
    const [now] = React.useState(() => Date.now());

    const status = React.useMemo<FreshnessStatus>(() => {
        if (!jobHealth) return 'no_data';
        const lastRun = new Date(jobHealth.finished_at);
        const hoursSinceLastRun = (now - lastRun.getTime()) / (1000 * 60 * 60);
        if (jobHealth.status === 'success') {
            return hoursSinceLastRun > 720 ? 'stale' : 'fresh';
        }
        return 'lagged';
    }, [jobHealth, now]);

    const handleRefresh = () => {
        const ym = year && month ? `${year}-${month}` : undefined;
        regenerate(ym);
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-48 bg-white/5" />
                    <Skeleton className="h-10 w-96 bg-white/5" />
                    <Skeleton className="h-3 w-64 bg-white/5" />
                </div>
                <Skeleton className="h-[560px] w-full bg-white/5 rounded-2xl" />
            </div>
        );
    }

    if (error || !digest) {
        return (
            <div className="py-16 px-4 text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-500">
                    <AlertCircle size={28} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Intelligence Feed Offline</h2>
                    <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
                        This digest has not been generated yet or could not be retrieved. Use the terminal to trigger generation.
                    </p>
                </div>
                <div className="flex justify-center gap-3">
                    <Button onClick={handleRefresh} disabled={isRegenerating} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase">
                        {isRegenerating ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                        {isRegenerating ? 'Generating...' : 'Generate Now'}
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-white/10">
                        <Link to="/regime-digest"><ArrowLeft className="mr-2 h-3 w-3" /> Archive</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const cleanHtml = digest.html_content
        .replace(/<!DOCTYPE html>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .trim();

    const [y, m] = digest.year_month.split('-');
    const formattedTitleDate = format(new Date(parseInt(y), parseInt(m) - 1), 'MMMM yyyy');
    const wordCount = digest.plain_text.split(/\s+/).length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/35 mb-3">
                        <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
                        <ChevronRight size={10} />
                        <Link to="/regime-digest" className="hover:text-blue-400 transition-colors">Archive</Link>
                        <ChevronRight size={10} />
                        <span className="text-blue-400/70">{digest.year_month}</span>
                    </nav>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                        {formattedTitleDate} <span className="text-blue-500">Regime</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                        <FreshnessChip
                            status={status}
                            lastUpdated={digest.created_at}
                            label={status === 'fresh' ? 'Live' : 'Archive'}
                        />
                        <span className="w-px h-3 bg-white/10" />
                        <span className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest">{readingMinutes} min read</span>
                        <span className="w-px h-3 bg-white/10" />
                        <span className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest">GraphiQuestor AI</span>
                    </div>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRegenerating}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-white/60 font-black text-[10px] tracking-widest uppercase h-9 px-4 rounded-lg self-start shrink-0"
                >
                    {isRegenerating
                        ? <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                        : <RefreshCw className="mr-1.5 h-3 w-3" />}
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
            </div>

            {/* Digest card */}
            <Card className="overflow-hidden border-white/[0.06] bg-slate-950/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-6 sm:p-10 lg:p-14">

                    {/* Subject line — the centrepiece */}
                    <div className="mb-10 pb-10 border-b border-white/[0.06]">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500/80 mb-4">
                            Intelligence Brief · {formattedTitleDate}
                        </p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15] max-w-3xl">
                            {digest.subject_line}
                        </h2>
                    </div>

                    {/* Macro vitals strip */}
                    {digest.metrics_snapshot && <MetricsStrip snapshot={digest.metrics_snapshot} />}

                    {/* Narrative body */}
                    <style>{`
                        .digest-body { max-width: 72ch; }
                        .digest-body h2 {
                            color: #fff;
                            font-size: 0.875rem;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                            margin-top: 3.5rem;
                            margin-bottom: 1.25rem;
                            padding-left: 0.875rem;
                            border-left: 2px solid #3b82f6;
                            line-height: 1.3;
                        }
                        .digest-body > h2:first-child { margin-top: 0; }
                        .digest-body h3 {
                            color: #7dd3fc;
                            font-size: 0.6875rem;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.14em;
                            margin-top: 2.25rem;
                            margin-bottom: 0.875rem;
                        }
                        .digest-body p {
                            color: #cbd5e1;
                            font-size: 0.9375rem;
                            line-height: 1.85;
                            margin-bottom: 1.375rem;
                        }
                        .digest-body strong { color: #f8fafc; font-weight: 800; }
                        .digest-body ul { margin: 1.25rem 0; padding: 0; list-style: none; }
                        .digest-body li {
                            color: #94a3b8;
                            font-size: 0.9rem;
                            line-height: 1.75;
                            margin-bottom: 0.75rem;
                            padding-left: 1.375rem;
                            position: relative;
                        }
                        .digest-body li::before {
                            content: '—';
                            position: absolute;
                            left: 0;
                            color: #3b82f6;
                            font-weight: 700;
                            opacity: 0.7;
                        }
                        .digest-body a { color: #60a5fa; text-decoration: none; }
                        .digest-body a:hover { color: #93c5fd; }
                        .digest-body hr {
                            border: none;
                            border-top: 1px solid rgba(255,255,255,0.05);
                            margin: 3rem 0;
                        }
                    `}</style>
                    <div dangerouslySetInnerHTML={{ __html: cleanHtml }} className="digest-body" />

                </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground/50 hover:text-white -ml-2">
                    <Link to="/regime-digest">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> All Editions
                    </Link>
                </Button>
                <p className="text-[9px] font-bold text-muted-foreground/25 uppercase tracking-widest">
                    Ref: {digest.id.substring(0, 8)} · {new Date(digest.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
            </div>
        </div>
    );
};

// ── Page shell ────────────────────────────────────────────────────────────────

export const RegimeDigestPage: React.FC = () => {
    const { year, month } = useParams<{ year: string; month: string }>();

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title={`${year}-${month} Macro Regime Digest | GraphiQuestor`}
                description="Institutional-grade monthly macro intelligence on Global Liquidity, Sovereign Stress, and De-Dollarization."
            />

            <SectionErrorBoundary name="Regime Digest">
                <RegimeDigestContent />
            </SectionErrorBoundary>

            <div className="mt-20 p-10 sm:p-14 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-950 border border-blue-500/10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)]" />
                <div className="relative z-10 space-y-5">
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500/70">Monthly Intelligence</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-tight">
                        Delivered to Your Inbox<br />on the 1st of Every Month
                    </h3>
                    <p className="text-sm text-slate-400/80 max-w-sm mx-auto leading-relaxed">
                        Institutional macro synthesis on Global Liquidity, Sovereign Stress, and structural regime shifts.
                    </p>
                    <div className="flex justify-center flex-wrap gap-3 pt-2">
                        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 rounded-xl h-12">
                            <a href="https://graphiquestor.com/#newsletter">Subscribe — Free</a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white/10 rounded-xl h-12 bg-white/[0.03] hover:bg-white/[0.06]">
                            <Link to="/">Open Terminal</Link>
                        </Button>
                    </div>
                </div>
            </div>
            <RelatedContent />
        </div>
    );
};
