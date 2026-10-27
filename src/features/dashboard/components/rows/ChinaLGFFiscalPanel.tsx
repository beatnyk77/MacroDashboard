import React, { useMemo } from 'react';
import { AlertTriangle, Building2, Landmark } from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useChinaDebtLayers, useChinaFiscalSignals, type ChinaFiscalSignal } from '@/hooks/useChinaDebt';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { cn } from '@/lib/utils';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const ChinaLGFFiscalPanel: React.FC = () => {
    const { data: layers, isLoading: layersLoading } = useChinaDebtLayers();
    const { data: signals, isLoading: signalsLoading } = useChinaFiscalSignals([
        'land_revenue_pct_lg',
        'land_revenue_collapse_idx',
        'lgfv_debt_outstanding',
        'special_refinancing_issued',
        'lgfv_bond_issuance_annual',
        'lgfv_net_issuance',
    ]);

    const isLoading = layersLoading || signalsLoading;

    const lgfvHistory = useMemo(() =>
        layers?.filter(l => l.layer_code === 'lgfv').map(l => ({
            year: l.as_of_date.slice(0, 4),
            low: l.value_low_pct_gdp,
            mid: l.value_pct_gdp,
            high: l.value_high_pct_gdp,
        })) ?? [],
    [layers]);

    const landHistory = useMemo(() =>
        signals?.filter(s => s.signal_key === 'land_revenue_pct_lg').map(s => ({
            year: s.as_of_date.slice(0, 4),
            value: s.value,
            low: s.value_low,
            high: s.value_high,
        })) ?? [],
    [signals]);

    const latestSignals = useMemo(() => {
        const byKey: Record<string, ChinaFiscalSignal> = {};
        signals?.forEach(s => {
            const existing = byKey[s.signal_key];
            if (!existing || s.as_of_date > existing.as_of_date) byKey[s.signal_key] = s;
        });
        return byKey;
    }, [signals]);

    const lgfvDebt = latestSignals.lgfv_debt_outstanding;
    const specialRefi = latestSignals.special_refinancing_issued;
    const netIssuance = latestSignals.lgfv_net_issuance;
    const landPct = latestSignals.land_revenue_pct_lg;
    const landCollapse = latestSignals.land_revenue_collapse_idx;

    if (isLoading) {
        return <div className="h-[500px] rounded-xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Building2 size={20} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider italic">
                        LGFV Debt Observatory
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Local government financing vehicles — the single largest shadow debt risk
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'LGFV Debt Outstanding',
                        value: lgfvDebt?.value,
                        range: lgfvDebt ? `${lgfvDebt.value_low}–${lgfvDebt.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: lgfvDebt?.value != null,
                    },
                    {
                        label: 'Special Refinancing Issued',
                        value: specialRefi?.value,
                        range: specialRefi ? `${specialRefi.value_low}–${specialRefi.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: specialRefi?.value != null && specialRefi.value > 1.5,
                    },
                    {
                        label: 'LGFV Net Issuance',
                        value: netIssuance?.value,
                        range: null,
                        unit: 'CNY Tn',
                        warn: netIssuance?.value != null && netIssuance.value < 0,
                    },
                    {
                        label: 'Land Revenue / LG Revenue',
                        value: landPct?.value,
                        range: null,
                        unit: '%',
                        warn: landPct?.value != null && landPct.value < 25,
                    },
                ].map(({ label, value, range, unit, warn }) => (
                    <div key={label} className={cn(
                        'p-5 rounded-xl border',
                        warn ? 'bg-amber-500/[0.04] border-amber-500/15' : 'bg-white/[0.02] border-border'
                    )}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-2">{label}</p>
                        <p className="text-2xl font-bold text-white font-mono">
                            {value != null ? value.toFixed(1) : '—'}
                            <span className="text-xs text-terminal-dim ml-1">{unit}</span>
                        </p>
                        {range && <p className="text-xs text-terminal-dim mt-1">Range: {range} {unit}</p>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        LGFV Debt Layer (% GDP) — Annual Range
                    </h4>
                    {lgfvHistory.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <ComposedChart data={lgfvHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="mid" fill={alpha(CHART_COLORS.gold, 0.5)} name="Estimate" radius={[2, 2, 0, 0]} />
                                <Line type="monotone" dataKey="high" stroke={CHART_COLORS.stress} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="High" />
                            </ComposedChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">LGFV layer history unavailable</p>
                    )}
                </div>

                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        Land Fiscal Dependence (% of LG Revenue)
                    </h4>
                    {landHistory.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <ComposedChart data={landHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit="%" domain={[0, 50]} />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.west} strokeWidth={2} dot={{ fill: CHART_COLORS.west, r: 3 }} name="Land %" />
                            </ComposedChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">Land revenue data unavailable</p>
                    )}
                </div>
            </div>

            {/* Special Refinancing Watch */}
            <div className="p-6 rounded-xl bg-rose-500/[0.04] border border-rose-500/15">
                <div className="flex items-center gap-2 mb-4">
                    <Landmark size={16} className="text-rose-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                        Special Refinancing Bond Watch
                    </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    When Beijing issues special refinancing bonds to swap LGFV debt, it signals implicit acknowledgment of
                    provincial distress and quasi-monetization. The 2023 wave totaled approximately{' '}
                    <span className="text-white font-mono">¥1.4T</span>; cumulative issuance through late 2024 is estimated at{' '}
                    <span className="text-white font-mono">
                        ¥{specialRefi?.value != null ? `${specialRefi.value.toFixed(2)}T` : '—'}
                    </span>.
                </p>
                {landCollapse && (
                    <div className="flex items-center gap-2 text-xs text-amber-400/80">
                        <AlertTriangle size={12} />
                        Land revenue collapse index: {landCollapse.value.toFixed(0)} vs 2021 peak (100) — fiscal cliff in real time
                    </div>
                )}
                <DataProvenanceBadge source="IMF Article IV / MoF" methodology="Curated staff estimates with ranges" size="sm" className="mt-4" />
            </div>
        </div>
    );
};