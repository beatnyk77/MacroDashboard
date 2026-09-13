import React, { useMemo } from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { m } from 'framer-motion';
import { Layers, TrendingUp, Info, BookOpen } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import {
    useChinaDebtLayers,
    LAYER_META,
    type ChinaDebtLayerCode,
} from '@/hooks/useChinaDebt';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const STACK_ORDER: ChinaDebtLayerCode[] = [
    'central_official',
    'local_gov',
    'lgfv',
    'policy_bank',
    'soe_contingent',
];

function layerValue(row: { value_pct_gdp: number | null; value_high_pct_gdp: number | null }) {
    return row.value_high_pct_gdp ?? row.value_pct_gdp ?? 0;
}

export const ChinaDebtIcebergHero: React.FC = () => {
    const { data: layers, isLoading } = useChinaDebtLayers();
    const { data: icebergMetric } = useLatestMetric(MID.CN_ICEBERG_RATIO);

    const latestYear = useMemo(() => {
        if (!layers?.length) return null;
        const dates = layers.map(l => l.as_of_date).sort();
        return dates[dates.length - 1]?.slice(0, 4) ?? null;
    }, [layers]);

    const latestLayers = useMemo(() => {
        if (!latestYear || !layers) return [];
        return STACK_ORDER
            .map(code => layers.find(l => l.layer_code === code && l.as_of_date.startsWith(latestYear)))
            .filter(Boolean) as typeof layers;
    }, [layers, latestYear]);

    const consolidated = useMemo(() => {
        if (!latestYear || !layers) return null;
        return layers.find(l => l.layer_code === 'consolidated' && l.as_of_date.startsWith(latestYear)) ?? null;
    }, [layers, latestYear]);

    const officialTotal = useMemo(() => {
        return latestLayers
            .filter(l => LAYER_META[l.layer_code as ChinaDebtLayerCode]?.aboveWater)
            .reduce((sum, l) => sum + layerValue(l), 0);
    }, [latestLayers]);

    const shadowTotal = useMemo(() => {
        return latestLayers
            .filter(l => !LAYER_META[l.layer_code as ChinaDebtLayerCode]?.aboveWater)
            .reduce((sum, l) => sum + layerValue(l), 0);
    }, [latestLayers]);

    const maxBar = Math.max(officialTotal + shadowTotal, consolidated?.value_high_pct_gdp ?? 0, 1);

    const historyChart = useMemo(() => {
        if (!layers) return [];
        const years = [...new Set(layers.map(l => l.as_of_date.slice(0, 4)))].sort();
        return years.map(year => {
            const cons = layers.find(l => l.layer_code === 'consolidated' && l.as_of_date.startsWith(year));
            const official = STACK_ORDER
                .filter(c => LAYER_META[c].aboveWater)
                .reduce((sum, code) => {
                    const row = layers.find(l => l.layer_code === code && l.as_of_date.startsWith(year));
                    return sum + (row ? layerValue(row) : 0);
                }, 0);
            return {
                year,
                official: Math.round(official * 10) / 10,
                consolidated: cons?.value_pct_gdp ?? null,
                consolidatedHigh: cons?.value_high_pct_gdp ?? null,
            };
        });
    }, [layers]);

    const icebergRatio = icebergMetric?.value
        ?? (consolidated?.value_high_pct_gdp && latestLayers[0]
            ? Math.round((consolidated.value_high_pct_gdp / (latestLayers[0].value_pct_gdp || 1)) * 10) / 10
            : null);

    if (isLoading) {
        return (
            <div className="h-[420px] w-full rounded-3xl bg-card border border-border animate-pulse" />
        );
    }

    if (!latestLayers.length) {
        return (
            <div className="p-8 rounded-3xl bg-card border border-border text-center">
                <p className="text-sm text-muted-foreground">China debt layer data unavailable</p>
            </div>
        );
    }

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden text-card-foreground"
        >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* Left: Iceberg stack */}
                <div className="lg:col-span-3 p-8 border-b lg:border-b-0 lg:border-r border-border">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <Layers size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-foreground uppercase tracking-uppercase italic">
                                The Iceberg — China Public Sector Debt
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Official vs shadow balance sheet · {latestYear} snapshot
                            </p>
                        </div>
                    </div>

                    {/* Waterline label */}
                    <div className="relative mb-2">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-uppercase text-blue-600 dark:text-blue-400">
                            <span>▲ Official (MoF-reported)</span>
                            <span className="text-muted-foreground">—</span>
                            <span className="text-amber-700 dark:text-amber-400">{officialTotal.toFixed(0)}% GDP</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {latestLayers.filter(l => LAYER_META[l.layer_code as ChinaDebtLayerCode]?.aboveWater).map((layer, i) => {
                            const meta = LAYER_META[layer.layer_code as ChinaDebtLayerCode];
                            const val = layerValue(layer);
                            const widthPct = (val / maxBar) * 100;
                            return (
                                <m.div
                                    key={layer.layer_code}
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.6, delay: i * 0.08 }}
                                    className="group"
                                >
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-black uppercase tracking-uppercase text-foreground">{meta.label}</span>
                                        <span className="font-mono text-foreground font-semibold">
                                            {layer.value_low_pct_gdp != null && layer.value_high_pct_gdp != null
                                                ? `${layer.value_low_pct_gdp.toFixed(0)}–${layer.value_high_pct_gdp.toFixed(0)}`
                                                : val.toFixed(1)}% GDP
                                        </span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <m.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${widthPct}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: meta.color }}
                                        />
                                    </div>
                                </m.div>
                            );
                        })}
                    </div>

                    {/* Waterline */}
                    <div className="flex items-center gap-3 py-3 border-y border-dashed border-border my-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground whitespace-nowrap">
                            Waterline · ~{officialTotal.toFixed(0)}% GDP official
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                    </div>

                    <div className="space-y-2">
                        {latestLayers.filter(l => !LAYER_META[l.layer_code as ChinaDebtLayerCode]?.aboveWater).map((layer, i) => {
                            const meta = LAYER_META[layer.layer_code as ChinaDebtLayerCode];
                            const val = layerValue(layer);
                            const widthPct = (val / maxBar) * 100;
                            return (
                                <m.div key={layer.layer_code} className="group">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-black uppercase tracking-uppercase text-foreground">{meta.label}</span>
                                        <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                                            {layer.value_low_pct_gdp != null && layer.value_high_pct_gdp != null
                                                ? `${layer.value_low_pct_gdp.toFixed(0)}–${layer.value_high_pct_gdp.toFixed(0)}`
                                                : val.toFixed(1)}% GDP
                                        </span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <m.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${widthPct}%` }}
                                            transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                                            className="h-full rounded-full opacity-80"
                                            style={{ backgroundColor: meta.color }}
                                        />
                                    </div>
                                </m.div>
                            );
                        })}
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground flex items-start gap-2">
                        <Info size={12} className="mt-0.5 shrink-0" />
                        Shadow layers show IMF Article IV / BIS ranges. Opaque estimates carry provenance — not point-precision claims.
                    </p>
                </div>

                {/* Right: KPIs + history */}
                <div className="lg:col-span-2 p-8 flex flex-col gap-6">
                    <div className="p-6 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
                        <p className="text-xs font-black uppercase tracking-uppercase text-amber-700 dark:text-amber-400 mb-1">
                            Iceberg Ratio
                        </p>
                        <p className="text-5xl font-black text-foreground font-mono tracking-tight">
                            {icebergRatio != null ? `${icebergRatio.toFixed(1)}×` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Consolidated (high) ÷ official central debt
                        </p>
                    </div>

                    {consolidated && (
                        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
                            <p className="text-xs font-black uppercase tracking-uppercase text-foreground mb-3">
                                Consolidated Range
                            </p>
                            <div className="flex items-end gap-4">
                                <div>
                                    <p className="text-2xl font-black text-foreground font-mono">{consolidated.value_low_pct_gdp?.toFixed(0) ?? '—'}%</p>
                                    <p className="text-xs text-muted-foreground">IMF Low</p>
                                </div>
                                <div className="text-muted-foreground text-xl pb-1">→</div>
                                <div>
                                    <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">{consolidated.value_high_pct_gdp?.toFixed(0) ?? '—'}%</p>
                                    <p className="text-xs text-muted-foreground">IMF High</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Shadow stack: ~{shadowTotal.toFixed(0)}% GDP below waterline
                            </p>
                        </div>
                    )}

                    <div className="flex-1 min-h-[140px]">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-muted-foreground" />
                            <p className="text-xs font-black uppercase tracking-uppercase text-muted-foreground">
                                Debt Progression 2015–{latestYear}
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={historyChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
                                <XAxis dataKey="year" tick={{ fill: 'currentColor', fontSize: 10 }} axisLine={false} tickLine={false} className="text-muted-foreground" />
                                <YAxis tick={{ fill: 'currentColor', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" className="text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 12, fontSize: 11, color: 'hsl(var(--popover-foreground))' }}
                                    formatter={(v: number) => [`${v}%`, '']}
                                />
                                <Area type="monotone" dataKey="official" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Official" />
                                <Area type="monotone" dataKey="consolidatedHigh" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Consolidated (high)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <DataProvenanceBadge
                            source="IMF WEO + Article IV"
                            methodology="GGXWDG_NGDP live; shadow layers from Article IV staff estimates"
                            size="sm"
                        />
                        <Link
                            to="/methods/china-debt-iceberg"
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                            <BookOpen size={11} />
                            Full Methodology
                        </Link>
                    </div>
                </div>
            </div>
        </m.div>
    );
};