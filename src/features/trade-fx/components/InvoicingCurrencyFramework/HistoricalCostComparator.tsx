import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend,
} from 'recharts';
import { FreshnessChip } from '@/components/FreshnessChip';
import { cn } from '@/lib/utils';
import { CompactDisclaimer } from '../CompactDisclaimer';
import {
    calculateHistoricalCostComparison,
    findDivergenceMonth,
    computeCnyInrAppreciation,
} from '../../lib/invoicingCalculations';
import { formatInrIndian } from '../../lib/formatInr';
import type { MonthlyRatePoint } from '../../lib/invoicingTypes';
import type { InvoicingFxRatesResult } from '../../hooks/useInvoicingFxRates';

type Props = {
    monthlyRates: MonthlyRatePoint[];
    fxMeta: InvoicingFxRatesResult;
    monthlyImportValue: number;
    onMonthlyImportChange: (v: number) => void;
};

function formatAxisMonth(month: string): string {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = months[Number(m) - 1] ?? m;
    return year ? `${label} '${year.slice(2)}` : label;
}

const ChartTooltip: React.FC<{
    active?: boolean;
    payload?: { payload: Record<string, number | string> }[];
}> = ({ active, payload }) => {
    if (!active || !payload?.[0]?.payload) return null;
    const row = payload[0].payload;
    const diff = Number(row.differenceINR);
    const usd = Number(row.usdInvoicedCostINR);
    const pct = usd > 0 ? ((diff / usd) * 100).toFixed(1) : '0';

    return (
        <div className="bg-slate-950/95 border border-white/10 rounded-lg px-3 py-2 text-[11px]">
            <div className="font-black text-white/80 mb-1">{String(row.monthLabel)}</div>
            <div className="text-blue-400">USD invoiced: {formatInrIndian(Number(row.usdInvoicedCostINR))}</div>
            <div className="text-amber-400">CNY invoiced: {formatInrIndian(Number(row.cnyInvoicedCostINR))}</div>
            <div className={cn('mt-1', diff > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                CNY premium: {formatInrIndian(diff)} ({diff > 0 ? '+' : ''}{pct}%)
            </div>
            <div className="text-[#B8860B] mt-1">
                Cumulative: {formatInrIndian(Number(row.cumulativeDifferenceINR))}
            </div>
        </div>
    );
};

export const HistoricalCostComparator: React.FC<Props> = ({
    monthlyRates,
    fxMeta,
    monthlyImportValue,
    onMonthlyImportChange,
}) => {
    const [periodMonths, setPeriodMonths] = useState<12 | 24>(24);

    const result = useMemo(
        () =>
            calculateHistoricalCostComparison(
                { monthlyImportValue, periodMonths },
                monthlyRates,
            ),
        [monthlyImportValue, periodMonths, monthlyRates],
    );

    const chartData = useMemo(
        () =>
            result.dataPoints.map((d) => ({
                ...d,
                monthLabel: formatAxisMonth(d.month),
                usdLakhs: d.usdInvoicedCostINR / 1e5,
                cnyLakhs: d.cnyInvoicedCostINR / 1e5,
                cumLakhs: d.cumulativeDifferenceINR / 1e5,
            })),
        [result.dataPoints],
    );

    const divergenceMonth = findDivergenceMonth(monthlyRates);
    const divergenceInWindow = divergenceMonth
        ? result.dataPoints.some((d) => d.month === divergenceMonth)
        : false;
    const cnyAppreciation = computeCnyInrAppreciation(monthlyRates, '2025-05', monthlyRates[monthlyRates.length - 1]?.month ?? '2026-06');

    if (fxMeta.isLoading) {
        return (
            <div className="h-64 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/25">
                    Loading FX cross-rate history…
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {!fxMeta.isLive ? (
                <p className="text-[11px] text-amber-400/80 m-0 border border-amber-500/20 rounded-lg px-3 py-2 bg-amber-500/[0.06]">
                    Live FRED telemetry unavailable — illustrative reference rates shown. Verify against RBI/FRED before contract execution.
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <FreshnessChip
                    status={fxMeta.staleness}
                    lastUpdated={fxMeta.freshness}
                />
                <span className="text-[10px] text-white/35">
                    FRED DEXINUS + DEXCHUS cross-rate · monthly average
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        Monthly import value from China (₹)
                    </span>
                    <input
                        type="number"
                        min={100000}
                        step={100000}
                        value={monthlyImportValue}
                        onChange={(e) =>
                            onMonthlyImportChange(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-mono text-white focus:border-[#B8860B]/40 focus:outline-none"
                    />
                    <span className="text-[10px] text-white/30">
                        Approximate monthly USD/CNY import value in INR equivalent
                    </span>
                </label>
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        Lookback period
                    </span>
                    <div className="flex gap-2">
                        {([12, 24] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPeriodMonths(p)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
                                    periodMonths === p
                                        ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40'
                                        : 'text-white/40 border-white/10 hover:text-white/70',
                                )}
                            >
                                {p}M
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="monthLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
                            tickFormatter={(v: number) => `₹${v.toFixed(0)}L`}
                            width={52}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
                            tickFormatter={(v: number) => `₹${v.toFixed(0)}L`}
                            width={48}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend verticalAlign="top" align="right" iconType="square" />
                        <Bar yAxisId="left" dataKey="usdLakhs" name="USD invoiced" fill="rgba(59,130,246,0.55)" barSize={8} />
                        <Bar yAxisId="left" dataKey="cnyLakhs" name="CNY invoiced" fill="rgba(245,158,11,0.65)" barSize={8} />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumLakhs"
                            name="Cumulative CNY premium"
                            stroke="#B8860B"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            dot={false}
                        />
                        {divergenceMonth && divergenceInWindow ? (
                            <ReferenceLine
                                x={formatAxisMonth(divergenceMonth)}
                                stroke="rgba(255,255,255,0.35)"
                                strokeDasharray="4 4"
                                label={{
                                    value: 'CNY/INR divergence',
                                    position: 'insideTopRight',
                                    fill: 'rgba(255,255,255,0.4)',
                                    fontSize: 9,
                                }}
                            />
                        ) : null}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MetricCard
                    label={`Total extra cost — CNY vs USD (${periodMonths}M)`}
                    value={formatInrIndian(result.summary.totalExtraCostCNY)}
                    tone={result.summary.totalExtraCostCNY > 0 ? 'danger' : 'success'}
                />
                <MetricCard
                    label="Current month premium (CNY vs USD)"
                    value={formatInrIndian(result.summary.currentMonthDelta)}
                    tone={result.summary.currentMonthDelta > 0 ? 'danger' : 'success'}
                />
                <MetricCard
                    label="CNY/INR appreciation since May 2025"
                    value={`${cnyAppreciation > 0 ? '+' : ''}${cnyAppreciation.toFixed(1)}%`}
                    tone={cnyAppreciation > 10 ? 'danger' : 'neutral'}
                />
            </div>

            <p className="text-sm text-white/70 m-0">
                On {formatInrIndian(monthlyImportValue, false)} monthly China imports over {periodMonths} months,{' '}
                {result.summary.totalExtraCostCNY > 0
                    ? `USD invoicing would have saved approximately ${formatInrIndian(result.summary.totalExtraCostCNY, false)} compared to CNY invoicing`
                    : result.summary.totalExtraCostCNY < 0
                      ? `CNY invoicing would have saved approximately ${formatInrIndian(Math.abs(result.summary.totalExtraCostCNY), false)} compared to USD invoicing`
                      : 'USD and CNY invoicing costs were equivalent'}{' '}
                based on exchange rate movements.
            </p>

            <CompactDisclaimer context="simulator" />
        </div>
    );
};

const MetricCard: React.FC<{
    label: string;
    value: string;
    tone: 'danger' | 'success' | 'neutral';
}> = ({ label, value, tone }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{label}</div>
        <div
            className={cn(
                'text-lg font-black font-mono',
                tone === 'danger' && 'text-rose-400',
                tone === 'success' && 'text-emerald-400',
                tone === 'neutral' && 'text-white/80',
            )}
        >
            {value}
        </div>
    </div>
);