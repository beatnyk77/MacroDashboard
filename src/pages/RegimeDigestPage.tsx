import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { ArrowLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useRegimeDigest } from '@/features/regime-digest/hooks/useRegimeDigest';
import { useIngestionHealth } from '@/features/daily-macro/hooks/useIngestionHealth';
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip';
import { format } from 'date-fns';

const RegimeDigestContent: React.FC = () => {
    const { year, month } = useParams<{ year: string; month: string }>();
    const { data: digest, isLoading, error, regenerate, isRegenerating } = useRegimeDigest(year, month);
    const { data: health } = useIngestionHealth();

    // Find health for this specific job
    const jobHealth = health?.find(h => h.job_name === 'generate-monthly-regime-digest');
    
    // Determine freshness status
    const status = React.useMemo<FreshnessStatus>(() => {
        if (!jobHealth) return 'no_data';
        
        const lastRun = new Date(jobHealth.finished_at);
        const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
        
        if (jobHealth.status === 'success') {
            return hoursSinceLastRun > 720 ? 'stale' : 'fresh'; // Monthly, so 30 days is "fresh"
        }
        return 'lagged';
    }, [jobHealth]);

    const handleRefresh = () => {
        const ym = year && month ? `${year}-${month}` : undefined;
        regenerate(ym);
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <Skeleton className="h-4 w-64 bg-white/5" />
                <Skeleton className="h-12 w-full max-w-2xl bg-white/5" />
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full bg-white/5 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !digest) {
        return (
            <div className="py-12 px-4 text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Intelligence Feed Offline</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        The requested regime digest could not be retrieved from the institutional ledger. 
                        It may not have been generated yet or the relay is currently unavailable.
                    </p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10">
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
                    </Button>
                    <Button asChild variant="ghost">
                        <Link to="/regime-digest">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Archive
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Sanitize HTML logic
    const cleanHtml = digest.html_content
        .replace(/<!DOCTYPE html>/i, '')
        .replace(/<html>/i, '')
        .replace(/<\/html>/i, '')
        .replace(/<body[^>]*>/i, '<div class="regime-digest-inner">') 
        .replace(/<\/body>/i, '</div>');

    const displayYearMonth = digest.year_month;
    const [y, m] = displayYearMonth.split('-');
    const formattedTitleDate = format(new Date(parseInt(y), parseInt(m) - 1), 'MMMM yyyy');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">
                        <Link to="/" className="hover:text-blue-400 transition-colors">HOME</Link>
                        <ChevronRight size={10} />
                        <Link to="/regime-digest" className="hover:text-blue-400 transition-colors">ARCHIVE</Link>
                        <ChevronRight size={10} />
                        <span className="text-blue-400/80">{displayYearMonth}</span>
                    </nav>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                        {formattedTitleDate} <span className="text-blue-500">Regime</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex flex-col items-end gap-1.5 mr-2">
                        <FreshnessChip 
                            status={status} 
                            lastUpdated={digest.created_at} 
                            label={status === 'fresh' ? 'VERIFIED' : 'HISTORICAL'}
                        />
                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            Intelligence Authenticity
                        </span>
                    </div>
                    <Button 
                        onClick={handleRefresh} 
                        disabled={isRegenerating}
                        variant="contained" 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase h-9 px-4 rounded-lg shadow-lg shadow-blue-500/20"
                    >
                        {isRegenerating ? (
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        {isRegenerating ? 'Syncing...' : 'Force Sync'}
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-white/5 bg-slate-950/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                <CardContent className="p-6 sm:p-12">
                    <div className="mb-10 pb-10 border-b border-white/5">
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-4">
                            {digest.subject_line}
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                            <span>Relay: GraphiQuestor Macro-AI</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span>Conf: 98.4%</span>
                        </div>
                    </div>

                    <div 
                        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
                        className="prose prose-invert prose-slate max-w-none 
                            prose-h2:text-white prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tight prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-4
                            prose-h3:text-blue-400/90 prose-h3:font-black prose-h3:uppercase prose-h3:text-sm prose-h3:tracking-widest prose-h3:mt-8
                            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base prose-p:mb-6
                            prose-strong:text-white prose-strong:font-black
                            prose-ul:my-6 prose-li:text-slate-400 prose-li:mb-2
                            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 transition-colors"
                    />
                </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
                    <Link to="/regime-digest">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Archives
                    </Link>
                </Button>
                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                    ID: {digest.id.substring(0, 8)} • Generated: {new Date(digest.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export const RegimeDigestPage: React.FC = () => {
    const { year, month } = useParams<{ year: string; month: string }>();
    
    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title={`Macro Regime Digest | ${year}-${month}`}
                description="Institutional-grade monthly macro intelligence."
            />
            
            <SectionErrorBoundary name="Regime Digest">
                <RegimeDigestContent />
            </SectionErrorBoundary>

            <div className="mt-20 p-12 rounded-3xl bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-white/5 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                            Secure the Alpha Edge
                        </h3>
                        <p className="text-sm font-medium text-slate-400 max-w-md mx-auto leading-relaxed">
                            Get institutional-grade macro intelligence, liquidity monitoring, and sovereign stress telemetry direct to your inbox monthly.
                        </p>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4">
                        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 rounded-xl h-14 group-hover:scale-105 transition-transform">
                            <a href="https://graphiquestor.com/#newsletter">
                                Subscribe for Free
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="border-white/10 rounded-xl h-14 bg-white/5">
                            <Link to="/">
                                Open Terminal
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

