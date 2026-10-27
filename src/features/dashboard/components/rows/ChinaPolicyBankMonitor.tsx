import React, { useMemo } from 'react';
import { Landmark, TrendingUp } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useChinaPolicyBanks, useChinaFiscalSignals } from '@/hooks/useChinaDebt';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const ChinaPolicyBankMonitor: React.FC = () => {
    const { data: banks, isLoading } = useChinaPolicyBanks();
    const { data: signals } = useChinaFiscalSignals(['policy_bank_bonds_total']);

    const latestYear = '2024';
    const latestBanks = useMemo(() =>
        banks?.filter(b => b.as_of_date.startsWith(latestYear)) ?? [],
    [banks]);

    const aggregateHistory = useMemo(() =>
        signals?.filter(s => s.signal_key === 'policy_bank_bonds_total').map(s => ({
            year: s.as_of_date.slice(0, 4),
            total: s.value,
            low: s.value_low,
            high: s.value_high,
        })) ?? [],
    [signals]);

    const institutionHistory = useMemo(() => {
        const years = [...new Set(banks?.map(b => b.as_of_date.slice(0, 4)) ?? [])].sort();
        return years.map(year => {
            const row: Record<string, string | number> = { year };
            ['CDB', 'EXIM', 'ADBC'].forEach(code => {
                const b = banks?.find(x => x.institution_code === code && x.as_of_date.startsWith(year));
                row[code] = b?.bonds_outstanding_cny_tn ?? 0;
            });
            return row;
        });
    }, [banks]);

    const totalOutstanding = latestBanks.reduce((s, b) => s + (b.bonds_outstanding_cny_tn ?? 0), 0);
    const avgSpread = latestBanks.length
        ? latestBanks.reduce((s, b) => s + (b.spread_vs_cgb_bps ?? 0), 0) / latestBanks.length
        : null;

    if (isLoading) {
        return <div className="h-[400px] rounded-xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Landmark size={20} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider italic">
                        Policy Bank Debt Monitor
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        CDB + EXIM + ADBC — the hidden sovereign balance sheet
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-white/[0.02] border border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-2">Aggregate Bonds</p>
                    <p className="text-2xl font-bold text-white font-mono">{totalOutstanding.toFixed(1)}<span className="text-xs text-terminal-dim ml-1">CNY Tn</span></p>
                </div>
                <div className="p-5 rounded-xl bg-white/[0.02] border border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-2">Avg Spread vs CGB</p>
                    <p className="text-2xl font-bold text-white font-mono">{avgSpread?.toFixed(0) ?? '—'}<span className="text-xs text-terminal-dim ml-1">bps</span></p>
                </div>
                {latestBanks.map(b => (
                    <div key={b.institution_code} className="p-5 rounded-xl bg-purple-500/[0.04] border border-purple-500/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/80 mb-2">{b.institution_code}</p>
                        <p className="text-xl font-bold text-white font-mono">{b.bonds_outstanding_cny_tn?.toFixed(1)} Tn</p>
                        <p className="text-xs text-terminal-dim mt-1">{b.pct_total_bond_market?.toFixed(1)}% of bond market</p>
                    </div>
                )).slice(0, 2)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        Bonds Outstanding by Institution
                    </h4>
                    {institutionHistory.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <BarChart data={institutionHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} unit=" Tn" />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="CDB" stackId="a" fill={CHART_COLORS.violet} name="CDB" />
                                <Bar dataKey="EXIM" stackId="a" fill={CHART_COLORS.indigo} name="EXIM" />
                                <Bar dataKey="ADBC" stackId="a" fill={CHART_COLORS.indigo} name="ADBC" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">No institution history</p>
                    )}
                </div>

                <div className="p-6 rounded-xl bg-white/[0.02] border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-4">
                        Aggregate Growth vs GDP
                    </h4>
                    {aggregateHistory.length > 0 ? (
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <LineChart data={aggregateHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }} axisLine={false} />
                                <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE} itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE} />
                                <Line type="monotone" dataKey="total" stroke={CHART_COLORS.violetSoft} strokeWidth={2} dot={{ fill: CHART_COLORS.violetSoft, r: 3 }} name="Total CNY Tn" />
                            </LineChart>
                        </MacroChartContainer>
                    ) : (
                        <p className="text-sm text-terminal-dim">No aggregate history</p>
                    )}
                </div>
            </div>

            <div className="p-5 rounded-xl bg-purple-500/[0.03] border border-purple-500/10 text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                <TrendingUp size={16} className="text-purple-400 shrink-0 mt-0.5" />
                <span>
                    Policy bank balance sheets expanded ~3× faster than GDP (2010–2020). Spread widening above 25bps vs CGB
                    would signal systemic quasi-fiscal stress. PSL channel via CDB remains the primary off-budget infrastructure financier.
                </span>
            </div>

            <DataProvenanceBadge source="CDB/EXIM/ADBC Annual Reports + BIS" size="sm" />
        </div>
    );
};