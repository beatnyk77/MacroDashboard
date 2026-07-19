import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DigestSummary {
    id: string;
    year_month: string;
    subject_line: string;
    generated_at: string | null;
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

    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const earliest = digests.length ? digests[digests.length - 1].year_month : currentYm;
    const presentSet = new Set(digests.map(d => d.year_month));
    const gapMonths = digests.length
        ? expectedYearMonths(earliest, currentYm).filter(ym => !presentSet.has(ym)).reverse()
        : [];

    return (
        <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title="Macro Regime Digest Archive"
                description="Monthly institutional-grade macro intelligence reports on Global Liquidity, Debt/Gold, and Geopolitics."
            />

            <div className="mb-12 border-b border-white/10 pb-10">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500 mb-3">
                    GraphiQuestor Desk Product
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">
                    Macro Regime<br /><span className="text-emerald-500">Digest Archive</span>
                </h1>
                <p className="text-sm text-muted-foreground/70 max-w-2xl leading-relaxed">
                    Monthly institutional synthesis on Global Liquidity, Sovereign Stress, De-Dollarization, and structural regime shifts. Published on the 1st of each month. Missing months are listed explicitly — never silent.
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

            <Card variant="elevated" className="overflow-hidden bg-slate-950/50 backdrop-blur-md border-white/10">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-16 flex flex-col items-center gap-4">
                            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-muted-foreground/40 animate-pulse">
                                Loading Intelligence Archive...
                            </p>
                        </div>
                    ) : digests.length === 0 ? (
                        <div className="p-16 flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                                <FileText className="w-5 h-5 text-blue-500/50" />
                            </div>
                            <p className="text-sm font-bold text-white/50">No digests published yet</p>
                            <p className="text-xs text-muted-foreground/40 max-w-xs">
                                The first digest will be generated on the 1st of next month, or you can trigger one from the terminal.
                            </p>
                            <Link
                                to="/"
                                className="mt-2 text-[10px] font-black tracking-widest uppercase text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Go to Terminal →
                            </Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {digests.map((digest, index) => (
                                <li key={digest.id} className="group">
                                    <Link
                                        to={`/regime-digest/${digest.year_month.replace('-', '/')}`}
                                        className="flex items-center justify-between gap-4 p-6 sm:p-8 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-start gap-5 flex-1 min-w-0">
                                            {/* Issue number */}
                                            <div className="hidden sm:flex flex-col items-center shrink-0 pt-0.5">
                                                <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/25">
                                                    #{digests.length - index}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/8 text-xs font-bold text-white/70">
                                                        <Calendar size={11} className="text-blue-400/70" />
                                                        {formatDate(digest.year_month)}
                                                    </div>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 text-[10px] font-black text-blue-400 tracking-widest uppercase">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base sm:text-lg font-bold text-white/90 group-hover:text-blue-400 transition-colors leading-snug truncate">
                                                    {digest.subject_line}
                                                </h3>
                                                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                                                    Published {digest.generated_at ? new Date(digest.generated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-blue-500 transition-colors shrink-0" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground/25 uppercase tracking-widest">
                GraphiQuestor · Institutional Macro Intelligence · Generated via AI synthesis
            </p>
        </div>
    );
};
