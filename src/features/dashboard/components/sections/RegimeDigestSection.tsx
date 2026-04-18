import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Newspaper, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RegimeDigestSection: React.FC = () => {
    const { data: latestDigest, isLoading } = useQuery({
        queryKey: ['latest-regime-digest'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('monthly_regime_digests')
                .select('year_month, subject_line, plain_text, created_at')
                .order('year_month', { ascending: false })
                .limit(1)
                .single();
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <Card variant="elevated">
                <CardContent className="h-[200px] flex items-center justify-center">
                    <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase animate-pulse">Loading Digest...</span>
                </CardContent>
            </Card>
        );
    }

    if (!latestDigest) return null;

    const [year, month] = latestDigest.year_month.split('-');
    const dateFormatted = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <Card variant="elevated" className="overflow-hidden border-blue-500/20 bg-slate-950">
            <CardContent className="p-0">
                <div className="relative">
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                    
                    <div className="relative p-6 md:p-8 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4">
                            <Newspaper className="text-blue-500 h-5 w-5" />
                            <span className="text-xs font-black tracking-[0.2em] uppercase text-blue-500">Macro Regime Digest</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                            {latestDigest.subject_line}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-3 py-1">
                                <Calendar size={14} className="text-blue-400" />
                                <span className="font-bold">{dateFormatted}</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground/80 mb-8 line-clamp-2 max-w-2xl">
                            {latestDigest.plain_text.substring(0, 200)}...
                        </p>
                        <div className="flex gap-4 items-center">
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md">
                                <Link to={`/regime-digest/${year}/${month}`}>
                                    Read Full Digest <ChevronRight size={16} className="ml-2" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 font-bold h-10 px-6 rounded-md text-white">
                                <Link to="/regime-digest">
                                    View Archive
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
