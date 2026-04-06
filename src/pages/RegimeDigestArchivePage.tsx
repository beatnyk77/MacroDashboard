import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DigestSummary {
    id: string;
    year_month: string;
    subject_line: string;
    generated_at: string;
}

export const RegimeDigestArchivePage: React.FC = () => {
    const [digests, setDigests] = useState<DigestSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDigests = async () => {
            const { data, error } = await supabase
                .from('monthly_regime_digests')
                .select('id, year_month, subject_line, generated_at')
                .order('year_month', { ascending: false });

            if (!error && data) {
                setDigests(data);
            }
            setLoading(false);
        };

        fetchDigests();
    }, []);

    const formatDate = (ym: string) => {
        const [y, m] = ym.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title="Macro Regime Digest Archive"
                description="Monthly institutional-grade macro intelligence reports on Global Liquidity, Debt/Gold, and Geopolitics."
            />
            
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black text-white tracking-heading uppercase mb-3">
                    Macro Regime Digest
                </h1>
                <p className="text-sm font-bold text-muted-foreground/60 tracking-uppercase uppercase">
                    Monthly institutional intelligence on Global Liquidity, Sovereign Stress, and De-Dollarization.
                </p>
            </div>

            <Card variant="elevated" className="overflow-hidden bg-slate-950/50 backdrop-blur-md border-white/10">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-sm font-bold tracking-uppercase uppercase text-muted-foreground/50 animate-pulse">
                            Loading archives...
                        </div>
                    ) : digests.length === 0 ? (
                        <div className="p-12 text-center text-sm font-bold tracking-uppercase uppercase text-muted-foreground/50">
                            No digests published yet.
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {digests.map((digest, index) => (
                                <li key={digest.id} className="group">
                                    <Link 
                                        to={`/regime-digest/${digest.year_month.replace('-', '/')}`}
                                        className="block p-6 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-bold text-white tracking-uppercase uppercase">
                                                        <Calendar size={12} className="text-blue-400" />
                                                        {formatDate(digest.year_month)}
                                                    </div>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-[10px] font-black text-blue-400 tracking-uppercase uppercase">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                                                    {digest.subject_line}
                                                </h3>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-blue-500 transition-colors shrink-0 mt-2" />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
