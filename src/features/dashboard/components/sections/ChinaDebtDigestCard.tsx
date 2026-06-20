import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, ArrowRight } from 'lucide-react';

export interface ChinaDebtDigestSection {
    headline: string;
    summary: string;
    composites?: Array<{
        id: string;
        label: string;
        value: number;
        unit: string;
        status: 'elevated' | 'watch' | 'stable';
        interpretation: string;
    }>;
    layer_snapshot?: {
        central_official_pct: number | null;
        consolidated_high_pct: number | null;
        iceberg_ratio: number | null;
    };
    watch_items?: string[];
}

const STATUS_STYLES: Record<string, string> = {
    elevated: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    watch: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    stable: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

interface ChinaDebtDigestCardProps {
    section: ChinaDebtDigestSection | null | undefined;
    compact?: boolean;
}

export const ChinaDebtDigestCard: React.FC<ChinaDebtDigestCardProps> = ({ section, compact = false }) => {
    if (!section?.headline) return null;

    return (
        <Card className="bg-amber-500/[0.04] border-amber-500/20 border overflow-hidden">
            <CardContent className={compact ? 'p-6' : 'p-8 md:p-10'}>
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Landmark size={16} className="text-amber-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-amber-400/80">
                                China Public Sector Debt
                            </span>
                            <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic mt-0.5">
                                {section.headline}
                            </h3>
                        </div>
                    </div>
                    <Link
                        to="/intel/china#debt"
                        className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 hover:text-amber-300 flex items-center gap-1 shrink-0"
                    >
                        Intel Hub <ArrowRight size={12} />
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6">
                    {section.summary}
                </p>

                {section.composites && section.composites.length > 0 && (
                    <div className={`grid gap-3 mb-6 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
                        {section.composites.map(c => (
                            <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-uppercase text-white/40 mb-1 truncate">
                                    {c.label}
                                </p>
                                <p className="text-lg font-black font-mono text-white">
                                    {c.value.toFixed(c.unit === '×' ? 2 : 1)}{c.unit}
                                </p>
                                <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${STATUS_STYLES[c.status] ?? STATUS_STYLES.watch}`}>
                                    {c.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {section.layer_snapshot && (
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground/60 mb-6 pb-6 border-b border-white/5">
                        {section.layer_snapshot.central_official_pct != null && (
                            <span>Central (official): {section.layer_snapshot.central_official_pct.toFixed(0)}% GDP</span>
                        )}
                        {section.layer_snapshot.consolidated_high_pct != null && (
                            <span>Consolidated (high): {section.layer_snapshot.consolidated_high_pct.toFixed(0)}% GDP</span>
                        )}
                        {section.layer_snapshot.iceberg_ratio != null && (
                            <span>Iceberg: {section.layer_snapshot.iceberg_ratio.toFixed(2)}×</span>
                        )}
                    </div>
                )}

                {section.watch_items && section.watch_items.length > 0 && (
                    <ul className="space-y-2">
                        {section.watch_items.map((item, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground/75 flex gap-2">
                                <span className="text-amber-400 shrink-0">◆</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                )}

                <Link
                    to="/methods/china-debt-iceberg"
                    className="inline-block mt-5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-amber-400/80 transition-colors"
                >
                    Methodology: China Debt Iceberg →
                </Link>
            </CardContent>
        </Card>
    );
};