import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Zap, Activity, Eye, TrendingUp, Globe, Info } from 'lucide-react';

interface Digest {
    week_ending_date: string;
    executive_summary: string;
    regime_shifts: Array<{ title: string; description: string }>;
    what_changed: Array<{ pillar: string; change: string }>;
    what_to_watch: string[];
    holistic_narrative: string;
}

export const WeeklyRegimeDigest: React.FC = () => {
    const { data: latestDigest, isLoading } = useQuery({
        queryKey: ['latest-weekly-regime-digest'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('weekly_regime_digests')
                .select('*')
                .order('week_ending_date', { ascending: false })
                .limit(1)
                .single();
            if (error) return null;
            return data as Digest;
        }
    });

    if (isLoading) {
        return (
            <div className="w-full space-y-4 animate-pulse">
                <div className="h-48 bg-slate-900/50 rounded-2xl border border-white/5" />
            </div>
        );
    }

    if (!latestDigest) return null;

    return (
        <div className="w-full space-y-6">
            {/* Main Narrative Card */}
            <Card variant="elevated" className="overflow-hidden border-blue-500/20 bg-slate-950/80 backdrop-blur-xl relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Globe size={120} className="text-blue-500" />
                </div>
                
                <CardContent className="p-8 md:p-10 relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <ShieldCheck className="text-blue-400 h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500/80">Weekly Macro Narrative</span>
                            <span className="text-xs font-bold text-muted-foreground/60">Regime: Fiscal Dominance Synthesis</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Executive Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                                {latestDigest.executive_summary?.split('.')[0] || 'Executive Summary'}.
                            </h2>
                            <p className="text-lg text-muted-foreground/90 leading-relaxed font-medium">
                                {latestDigest.executive_summary?.split('.').slice(1).join('.') || ''}
                            </p>
                            
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-sm font-bold text-blue-400/80 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Activity size={14} /> Holistic Synthesis
                                </p>
                                <p className="text-muted-foreground/70 italic text-sm leading-relaxed">
                                    "{latestDigest.holistic_narrative}"
                                </p>
                            </div>
                        </div>

                        {/* Regime Shifts */}
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Zap size={16} className="text-amber-400" /> Key Regime Shifts
                                </h3>
                                <div className="space-y-6">
                                    {latestDigest.regime_shifts?.map((shift, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <p className="text-xs font-black text-white/90 uppercase tracking-wide">{shift.title}</p>
                                            <p className="text-[13px] text-muted-foreground/60 leading-snug">{shift.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change & Watch Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="elevated" className="bg-slate-900/40 border-white/5 border backdrop-blur-md">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp size={14} /> What Changed vs Last Week
                        </h3>
                        <div className="space-y-4">
                            {latestDigest.what_changed?.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                    <span className="text-[10px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded text-muted-foreground uppercase">{item.pillar}</span>
                                    <p className="text-sm text-muted-foreground/80 leading-snug">{item.change}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card variant="elevated" className="bg-slate-900/40 border-white/5 border backdrop-blur-md">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Eye size={14} /> Tactical Watch: Next 7-14 Days
                        </h3>
                        <div className="space-y-4">
                            {latestDigest.what_to_watch?.map((watch, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />
                                    <p className="text-sm text-muted-foreground/80 leading-snug">{watch}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                            <Info size={10} /> Data verified against institutional snapshots
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
