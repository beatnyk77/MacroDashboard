import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRegimeDigest } from '@/features/regime-digest/hooks/useRegimeDigest';
import { useIngestionHealth } from '@/features/daily-macro/hooks/useIngestionHealth';
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip';

export const RegimeDigestSection: React.FC = () => {
    const { data: latestDigest, isLoading, regenerate, isRegenerating } = useRegimeDigest();
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

    if (isLoading) {
        return (
            <Card variant="elevated" className="overflow-hidden border-white/5 bg-slate-950/40">
                <CardContent className="h-[220px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] animate-pulse">Synchronizing Intelligence...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!latestDigest) {
        return (
            <Card variant="elevated" className="overflow-hidden border-white/5 bg-slate-950/60">
                <CardContent className="p-6 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Newspaper className="text-blue-500/50 h-4 w-4" />
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500/50">Monthly Regime Digest</span>
                            </div>
                            <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">
                                No digest generated yet for this period.
                            </p>
                        </div>
                        {import.meta.env.DEV && (
                            <Button
                                onClick={() => regenerate(undefined)}
                                disabled={isRegenerating}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase h-11 px-8 rounded-lg shrink-0"
                            >
                                {isRegenerating ? (
                                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                )}
                                {isRegenerating ? 'Generating...' : 'Generate Digest'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const [year, month] = latestDigest.year_month.split('-');
    const dateFormatted = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // First 2 sentences of the plain text as a meaningful preview
    const previewText = latestDigest.plain_text
        .replace(/\s+/g, ' ')
        .match(/[^.!?]+[.!?]+/g)
        ?.slice(0, 2)
        .join(' ')
        .trim() ?? latestDigest.plain_text.substring(0, 200);

    return (
        <Card variant="elevated" className="overflow-hidden border-blue-500/10 bg-slate-950 group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />

            <CardContent className="p-0">
                <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Newspaper className="text-blue-500 h-4 w-4" />
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500">Monthly Regime Digest</span>
                            </div>
                            <div className="h-px w-12 bg-white/5" />
                            <FreshnessChip
                                status={status}
                                lastUpdated={latestDigest.created_at}
                                label={status === 'fresh' ? 'VERIFIED' : 'HISTORICAL'}
                            />
                        </div>

                        <div>
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tighter leading-none group-hover:text-blue-400 transition-colors">
                                {latestDigest.subject_line}
                            </h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-blue-500/50" />
                                    <span>{dateFormatted} Edition</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span>Institutional Analysis</span>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                            {previewText}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[180px]">
                        <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase h-11 px-8 rounded-lg shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02]">
                            <Link to={`/regime-digest/${year}/${month}`}>
                                Read Full Digest <ChevronRight size={14} className="ml-2" />
                            </Link>
                        </Button>
                        {import.meta.env.DEV && (
                            <Button
                                onClick={() => regenerate(undefined)}
                                disabled={isRegenerating}
                                variant="outline"
                                className="border-white/10 hover:bg-white/5 text-white font-bold text-[10px] tracking-widest uppercase h-11 px-8 rounded-lg"
                            >
                                {isRegenerating ? (
                                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                )}
                                {isRegenerating ? 'Syncing...' : 'Force Sync'}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
