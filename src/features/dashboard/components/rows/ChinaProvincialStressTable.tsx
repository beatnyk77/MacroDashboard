import React, { useMemo, useState } from 'react';
import { MapPin, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useChinaProvincialStress, type ChinaProvincialFiscalStress } from '@/hooks/useChinaDebt';
import { ChinaProvincialLeafletMap } from '@/features/dashboard/components/maps/ChinaProvincialLeafletMap';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';

type SortKey = 'composite_stress_score' | 'land_revenue_decline_pct' | 'debt_to_fiscal_revenue_pct' | 'lgfv_concentration_score';

function stressColor(score: number | null): string {
    if (score == null) return 'text-white/40';
    if (score >= 80) return 'text-rose-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-emerald-400';
}

function stressBg(score: number | null): string {
    if (score == null) return 'bg-white/5';
    if (score >= 80) return 'bg-rose-500/15';
    if (score >= 60) return 'bg-amber-500/15';
    if (score >= 40) return 'bg-yellow-500/10';
    return 'bg-emerald-500/10';
}

function stressFill(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#eab308';
    return '#10b981';
}

export const ChinaProvincialStressTable: React.FC = () => {
    const { data, isLoading } = useChinaProvincialStress();
    const [sortKey, setSortKey] = useState<SortKey>('composite_stress_score');
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | undefined>();

    const sorted = useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            return sortAsc ? av - bv : bv - av;
        });
    }, [data, sortKey, sortAsc]);

    const watchlist = sorted.filter(p => p.watchlist_flag);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const sortIndicator = (col: SortKey) => {
        if (sortKey !== col) return null;
        return sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
    };

    if (isLoading) {
        return <div className="h-[500px] rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                        <MapPin size={20} className="text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                            Provincial Fiscal Stress Terminal
                        </h3>
                        <p className="text-xs text-muted-foreground/60">
                            Sortable stress scores — map deferred; table-first intelligence
                        </p>
                    </div>
                </div>
                <DataProvenanceBadge source="IMF Article IV 2024" size="sm" />
            </div>

            {/* Choropleth map */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 h-[420px]">
                    <ChinaProvincialLeafletMap
                        data={sorted}
                        getColor={stressFill}
                        getValue={(row) => row.composite_stress_score ?? 0}
                        tooltipFormatter={(row) =>
                            `${row.province_name}: Stress ${row.composite_stress_score?.toFixed(0) ?? '—'}${row.watchlist_flag ? ' ⚠' : ''}`
                        }
                        selectedCode={selectedCode}
                        onProvinceClick={(row) => setSelectedCode(row.province_code)}
                    />
                </div>
                <div className="flex flex-col gap-3 justify-center">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/30">Stress Scale</p>
                    {[
                        { label: '80+ Critical', color: '#ef4444' },
                        { label: '60–79 Elevated', color: '#f59e0b' },
                        { label: '40–59 Watch', color: '#eab308' },
                        { label: '<40 Stable', color: '#10b981' },
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                            <span className="text-xs text-muted-foreground/60">{label}</span>
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground/40 mt-4 leading-relaxed">
                        Provinces without seeded data render neutral. Click a province to highlight.
                    </p>
                </div>
            </div>

            {/* Watchlist strip */}
            {watchlist.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-uppercase text-rose-400/80 mr-2 self-center">
                        Watchlist:
                    </span>
                    {watchlist.map(p => (
                        <span
                            key={p.province_code}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-black text-rose-300 uppercase tracking-uppercase"
                        >
                            <AlertTriangle size={10} />
                            {p.province_name}
                        </span>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40">Province</th>
                            <th
                                className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40 cursor-pointer hover:text-white/60"
                                onClick={() => handleSort('composite_stress_score')}
                            >
                                <span className="inline-flex items-center gap-1">Stress Score {sortIndicator('composite_stress_score')}</span>
                            </th>
                            <th
                                className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40 cursor-pointer hover:text-white/60"
                                onClick={() => handleSort('land_revenue_decline_pct')}
                            >
                                <span className="inline-flex items-center gap-1">Land Δ% {sortIndicator('land_revenue_decline_pct')}</span>
                            </th>
                            <th
                                className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40 cursor-pointer hover:text-white/60"
                                onClick={() => handleSort('debt_to_fiscal_revenue_pct')}
                            >
                                <span className="inline-flex items-center gap-1">Debt/Rev {sortIndicator('debt_to_fiscal_revenue_pct')}</span>
                            </th>
                            <th
                                className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40 cursor-pointer hover:text-white/60"
                                onClick={() => handleSort('lgfv_concentration_score')}
                            >
                                <span className="inline-flex items-center gap-1">LGFV Conc. {sortIndicator('lgfv_concentration_score')}</span>
                            </th>
                            <th className="px-4 py-3 text-xs font-black uppercase tracking-uppercase text-white/40 hidden lg:table-cell">Risk Profile</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row: ChinaProvincialFiscalStress) => (
                            <tr
                                key={row.province_code}
                                className={cn(
                                    'border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors',
                                    row.watchlist_flag && 'bg-rose-500/[0.02]'
                                )}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-white/30">{row.province_code}</span>
                                        <span className="text-sm font-bold text-white">{row.province_name}</span>
                                        {row.watchlist_flag && <AlertTriangle size={12} className="text-rose-400" />}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-black font-mono',
                                        stressBg(row.composite_stress_score),
                                        stressColor(row.composite_stress_score)
                                    )}>
                                        {row.composite_stress_score?.toFixed(0) ?? '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-rose-300/80">
                                    {row.land_revenue_decline_pct != null ? `${row.land_revenue_decline_pct.toFixed(0)}%` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-white/70">
                                    {row.debt_to_fiscal_revenue_pct != null ? `${row.debt_to_fiscal_revenue_pct.toFixed(0)}%` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-amber-300/80">
                                    {row.lgfv_concentration_score?.toFixed(0) ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground/60 hidden lg:table-cell max-w-[200px] truncate">
                                    {row.risk_profile ?? '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-muted-foreground/50 leading-relaxed">
                Composite score weights: land revenue decline (30%), debt-to-fiscal-revenue (25%), LGFV concentration (25%),
                special bond acceleration (20%). GeoJSON: provincial administrative boundaries.
            </p>
        </div>
    );
};