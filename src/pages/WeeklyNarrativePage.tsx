import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ShareButton } from '@/components/ShareButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    AlertCircle,
    Activity,
    Info,
    Calendar,
} from 'lucide-react';
import { ChinaDebtDigestCard, type ChinaDebtDigestSection } from '@/features/dashboard/components/sections/ChinaDebtDigestCard';

interface WeeklyRegimeDigest {
    id: string;
    week_ending_date: string;
    executive_summary: string;
    regime_shifts: Array<{ title: string; description: string }>;
    what_changed: Array<{ pillar: string; change: string }>;
    what_to_watch: string[];
    holistic_narrative: string;
    china_debt_section?: ChinaDebtDigestSection;
    created_at: string;
}

const WeeklyNarrativeContent: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const [digest, setDigest] = useState<WeeklyRegimeDigest | null>(null);
    const [prevDate, setPrevDate] = useState<string | null>(null);
    const [nextDate, setNextDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!date) return;

        const fetchDigest = async () => {
            setLoading(true);
            setNotFound(false);

            // Fetch the requested digest
            const { data, error } = await supabase
                .from('weekly_regime_digests')
                .select('*')
                .eq('week_ending_date', date)
                .single();

            if (error || !data) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setDigest(data as unknown as WeeklyRegimeDigest); // TODO(types): regime_shifts/what_changed/what_to_watch are Json

            // Fetch adjacent weeks in parallel
            const [prevRes, nextRes] = await Promise.all([
                supabase
                    .from('weekly_regime_digests')
                    .select('week_ending_date')
                    .lt('week_ending_date', date)
                    .order('week_ending_date', { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from('weekly_regime_digests')
                    .select('week_ending_date')
                    .gt('week_ending_date', date)
                    .order('week_ending_date', { ascending: true })
                    .limit(1)
                    .maybeSingle(),
            ]);

            setPrevDate(prevRes.data?.week_ending_date ?? null);
            setNextDate(nextRes.data?.week_ending_date ?? null);
            setLoading(false);
        };

        fetchDigest();
    }, [date]);

    // Format date for display — guard against timezone shifts by parsing manually
    const formatDate = (iso: string) => {
        const [year, month, day] = iso.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-4 w-64 bg-white/5" />
                <Skeleton className="h-14 w-3/4 bg-white/5" />
                <Skeleton className="h-[200px] w-full bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Skeleton className="lg:col-span-8 h-[300px] bg-white/5 rounded-2xl" />
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-[180px] bg-white/5 rounded-2xl" />
                        <Skeleton className="h-[180px] bg-white/5 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !digest) {
        return (
            <div className="py-20 text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-500">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                        Digest Not Found
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        No intelligence digest exists for <strong>{date}</strong>. It may not have been
                        generated yet.
                    </p>
                </div>
                <Link
                    to="/weekly-narrative"
                    className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft size={14} /> Back to Archive
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
                <ChevronRight size={10} />
                <Link to="/weekly-narrative" className="hover:text-blue-400 transition-colors">
                    Weekly Narrative
                </Link>
                <ChevronRight size={10} />
                <span className="text-blue-400/80">{digest.week_ending_date}</span>
            </nav>

            {/* Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <Calendar size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                        Weekly Macro Intelligence
                    </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-serif font-medium text-foreground leading-tight tracking-tight">
                    Week Ending {formatDate(digest.week_ending_date)}
                </h1>
                <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                    GraphiQuestor Macro-AI · Generated{' '}
                    {new Date(digest.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </p>
            </div>

            {/* China Debt Section */}
            <ChinaDebtDigestCard section={digest.china_debt_section} />

            {/* Executive Summary */}
            <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden group hover:bg-blue-500/10 transition-all duration-500">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                <CardContent className="p-8 md:p-10 relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="px-2.5 py-1 bg-blue-500 text-white text-xs font-black tracking-widest uppercase rounded shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            REGIME FOCUS
                        </div>
                        <span className="text-xs font-bold text-blue-400 tracking-[0.25em] uppercase">
                            Executive Summary
                        </span>
                    </div>
                    <p className="text-2xl md:text-3xl font-serif leading-relaxed text-foreground font-normal">
                        {digest.executive_summary}
                    </p>
                </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sectional Divergence */}
                <div className="lg:col-span-8">
                    <Card className="bg-card/20 backdrop-blur-md border-white/5 h-full">
                        <CardContent className="p-8 md:p-10">
                            <h5 className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase mb-10 flex items-center gap-3">
                                <div className="p-1 rounded bg-primary/10">
                                    <Activity size={14} className="text-primary" />
                                </div>
                                Sectional Divergence
                            </h5>
                            <div className="space-y-12">
                                {digest.what_changed?.map((section, idx) => (
                                    <div key={idx} className="group/item relative">
                                        <h6 className="text-sm font-black text-foreground group-hover/item:text-primary transition-colors uppercase tracking-widest mb-3">
                                            {section.pillar}
                                        </h6>
                                        <p className="text-base leading-relaxed text-muted-foreground group-hover/item:text-foreground/90 transition-colors font-medium">
                                            {section.change}
                                        </p>
                                        {idx < (digest.what_changed?.length || 0) - 1 && (
                                            <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mt-10" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Proprietary View */}
                    <Card className="bg-emerald-500/5 border-emerald-500/20 border-dashed hover:bg-emerald-500/10 transition-all duration-300 group/insight">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="p-1.5 rounded-full bg-emerald-500/10">
                                    <Info size={16} className="text-emerald-500" />
                                </div>
                                <span className="text-xs font-black tracking-widest text-emerald-500 uppercase">
                                    Proprietary View
                                </span>
                            </div>
                            <p className="text-base font-medium italic text-foreground/90 leading-relaxed border-l-2 border-emerald-500/30 pl-5 py-1">
                                "{digest.holistic_narrative}"
                            </p>
                        </CardContent>
                    </Card>

                    {/* What to Watch */}
                    <Card className="bg-card/40 border-white/12 hover:border-white/20 transition-all shadow-xl">
                        <CardContent className="p-8">
                            <h5 className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase mb-6 flex justify-between items-center">
                                Next Window
                                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    HIGH IMPACT
                                </span>
                            </h5>
                            <ul className="space-y-4">
                                {digest.what_to_watch.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="text-sm text-muted-foreground leading-relaxed font-medium flex gap-3"
                                    >
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Regime Shifts */}
            {digest.regime_shifts?.length > 0 && (
                <Card className="bg-card/20 border-white/5">
                    <CardContent className="p-8 md:p-10">
                        <h5 className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase mb-8">
                            Key Regime Shifts
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {digest.regime_shifts.map((shift, idx) => (
                                <div
                                    key={idx}
                                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <h6 className="text-xs font-black text-primary uppercase tracking-widest">
                                            {shift.title}
                                        </h6>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {shift.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Prev / Next Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                {prevDate ? (
                    <Link
                        to={`/weekly-narrative/${prevDate}`}
                        className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">
                            {formatDate(prevDate)}
                        </span>
                        <span className="sm:hidden">Previous</span>
                    </Link>
                ) : (
                    <Link
                        to="/weekly-narrative"
                        className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Archive
                    </Link>
                )}

                <Link
                    to="/weekly-narrative"
                    className="text-[10px] font-bold text-muted-foreground/30 hover:text-muted-foreground uppercase tracking-widest transition-colors"
                >
                    All Weeks
                </Link>

                {nextDate ? (
                    <Link
                        to={`/weekly-narrative/${nextDate}`}
                        className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest group"
                    >
                        <span className="hidden sm:inline">
                            {formatDate(nextDate)}
                        </span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                ) : (
                    <span className="text-xs font-black text-muted-foreground/20 uppercase tracking-widest">
                        Latest
                    </span>
                )}
            </div>
        </div>
    );
};

export const WeeklyNarrativePage: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const shareRef = React.useRef<HTMLDivElement>(null);

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title={`Weekly Macro Narrative · ${date ?? ''} | GraphiQuestor`}
                description="Institutional-grade weekly macro regime intelligence covering global liquidity, sovereign risk, and de-dollarization dynamics."
                ogImage={date ? `https://graphiquestor.com/og/narrative-${date}.png` : undefined}
            />
            <div ref={shareRef} className="relative group">
                {date && (
                    <div className="absolute right-0 top-0 z-10">
                        <ShareButton
                            targetRef={shareRef}
                            title={`Weekly Macro Narrative — ${date}`}
                            dataSource="GraphiQuestor Regime Engine"
                            href={`/weekly-narrative/${date}`}
                        />
                    </div>
                )}
                <SectionErrorBoundary name="Weekly Narrative">
                    <WeeklyNarrativeContent />
                </SectionErrorBoundary>
            </div>
        </div>
    );
};
