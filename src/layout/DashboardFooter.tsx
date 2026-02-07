import React from 'react';
import { ExternalLink, Database, Shield, Github, Activity, Clock, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getStaleness } from '@/hooks/useStaleness';
import { cn } from '@/lib/utils';

export const DashboardFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    // Fetch latest ingestion timestamp for trust signal
    const { data: lastIngestion } = useQuery({
        queryKey: ['last_ingestion'],
        queryFn: async () => {
            const { data } = await supabase
                .from('ingestion_logs')
                .select('completed_at')
                .order('completed_at', { ascending: false })
                .limit(1)
                .single();

            return data?.completed_at ? new Date(data.completed_at) : null;
        },
        staleTime: 1000 * 60 * 5,
    });

    const { state: stalenessState } = getStaleness(lastIngestion);


    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'System Syncing...';
        const diffMs = new Date().getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <footer className="bg-slate-950/80 backdrop-blur-md border-t border-white/10 pt-12 pb-8 mt-auto relative z-10">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="text-blue-500" size={24} />
                            <h6 className="text-xl font-black tracking-tight leading-none text-foreground">
                                Graphi<span className="text-blue-500">Questor</span>
                            </h6>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                            The primary macro-economic observatory for institutional-grade monitoring of global liquidity, monetary regimes, and sovereign risk.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://github.com" target="_blank" className="text-white/50 hover:text-white transition-opacity">
                                <Github size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Major Sources */}
                    <div className="col-span-1 sm:col-span-6 md:col-span-2">
                        <span className="block text-xs font-black text-foreground uppercase tracking-wider mb-4">
                            Major Sources
                        </span>
                        <div className="flex flex-col gap-2">
                            <a href="https://fred.stlouisfed.org" target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                FRED (Fed) <ExternalLink size={10} />
                            </a>
                            <a href="https://www.bis.org" target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                BIS Statistics <ExternalLink size={10} />
                            </a>
                            <a href="https://www.imf.org" target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                IMF / WEO <ExternalLink size={10} />
                            </a>
                            <a href="https://fiscaldata.treasury.gov" target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                US Treasury <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>

                    {/* Protocol */}
                    <div className="col-span-1 sm:col-span-6 md:col-span-2">
                        <span className="block text-xs font-black text-foreground uppercase tracking-wider mb-4">
                            Protocol
                        </span>
                        <div className="flex flex-col gap-3">
                            <a href="/methodology" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                Methodology <BookOpen size={10} />
                            </a>
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-muted-foreground" />
                                <span className="text-[0.65rem] text-muted-foreground">
                                    Ingestion: <span className="text-primary font-bold ml-1">{formatTimeAgo(lastIngestion ?? null)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Audited Integrity */}
                    <div className="col-span-1 md:col-span-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={14} className="text-emerald-500" />
                                <span className="text-[0.65rem] font-black text-emerald-500 tracking-wider uppercase">
                                    AUDITED INTEGRITY
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                All data points are cross-validated against secondary sources. Z-scores are computed against a rolling 252-day window (High Frequency) or 10-year baseline (Sovereign).
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <Database size={12} className={cn(
                                    stalenessState === 'fresh' ? 'text-emerald-500' : stalenessState === 'lagged' ? 'text-amber-500' : 'text-rose-500'
                                )} />
                                <span className="text-[0.65rem] text-muted-foreground">
                                    Pipe Status: <span className={cn(
                                        "font-bold ml-1",
                                        stalenessState === 'fresh' ? 'text-emerald-500' : stalenessState === 'lagged' ? 'text-amber-500' : 'text-rose-500'
                                    )}>
                                        {stalenessState === 'fresh' ? 'STABILIZED' : stalenessState === 'lagged' ? 'LAGGED' : 'DETACHED'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="my-8 h-px bg-white/5" />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[0.65rem] text-muted-foreground/50">
                        © {currentYear} GraphiQuestor Macro Intelligence.
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground/50 italic text-center sm:text-right max-w-xl">
                        Disclaimer: Open-source research tool. Not financial advice. Verify all critical data via official primary publications.
                    </span>
                </div>
            </div>
        </footer>
    );
};
