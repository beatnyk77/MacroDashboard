import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend,
} from 'recharts';
import { MACRO_EVENTS } from '../constants/macroEvents';
import { getPairConfig } from '../constants/currencyPairs';
import { ILLUSTRATIVE_USD_INR_RATES } from '../constants/illustrativeRateData';
import {
    buildIllustrativeRateChartData,
    buildRateChartData,
    filterHistoryByHorizon,
} from '../lib/chartUtils';
import type { CurrencyPair, TimeHorizon } from '../lib/tradeFxTypes';

type RateRegimeChartProps = {
    pair: CurrencyPair;
    horizon: TimeHorizon;
    spotHistory: { date: string; value: number }[];
    regimeNote: string;
    volatilityRegime: string;
    isLoading?: boolean;
    isIllustrative?: boolean;
};

type ChartRow = {
    date: string;
    spot: number;
    volLower: number;
    volUpper: number;
    bandWidth: number;
};

const ChartTooltip: React.FC<{
    active?: boolean;
    payload?: { payload: ChartRow }[];
    pair: CurrencyPair;
    regimeNote: string;
    volatilityRegime: string;
}> = ({ active, payload, pair, regimeNote, volatilityRegime }) => {
    if (!active || !payload?.[0]?.payload) return null;
    const row = payload[0].payload;

    return (
        <div className="bg-slate-950/95 border border-white/10 rounded-lg px-3 py-2 text-[11px] max-w-[260px]">
            <div className="font-black text-white/80 mb-1">
                {new Date(row.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </div>
            <div className="text-[#B8860B] font-mono font-bold">
                {pair} ₹{row.spot.toFixed(2)}
            </div>
            <div className="text-white/50 mt-1">
                Vol band: ±₹{row.bandWidth.toFixed(2)} (1σ rolling)
            </div>
            <div className="text-white/40 mt-1 capitalize">
                Regime: {volatilityRegime} volatility
            </div>
            <div className="text-white/35 mt-1 leading-snug">{regimeNote}</div>
        </div>
    );
};

export const RateRegimeChart: React.FC<RateRegimeChartProps> = ({
    pair,
    horizon,
    spotHistory,
    regimeNote,
    volatilityRegime,
    isLoading = false,
    isIllustrative = false,
}) => {
    const pairConfig = getPairConfig(pair);

    const chartData = useMemo(() => {
        if (isIllustrative) {
            return buildIllustrativeRateChartData(ILLUSTRATIVE_USD_INR_RATES);
        }
        const filtered = filterHistoryByHorizon(spotHistory, horizon);
        return buildRateChartData(filtered);
    }, [spotHistory, horizon, isIllustrative]);

    const visibleEvents = useMemo(() => {
        if (chartData.length === 0) return [];
        const minDate = chartData[0].date;
        const maxDate = chartData[chartData.length - 1].date;
        return MACRO_EVENTS.filter((e) => e.date >= minDate && e.date <= maxDate);
    }, [chartData]);

    const yDomain = useMemo((): [number, number] => {
        const lows = chartData.map((d) => d.volLower);
        const highs = chartData.map((d) => d.volUpper);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const pad = Math.max((max - min) * 0.08, 0.5);
        return [min - pad, max + pad];
    }, [chartData]);

    const interpretation = useMemo(() => {
        if (chartData.length === 0) return null;
        const spots = chartData.map((d) => d.spot);
        const spotMin = Math.min(...spots);
        const spotMax = Math.max(...spots);
        const range = (spotMax - spotMin).toFixed(1);
        const formatMonth = (date: string) =>
            new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const startLabel = formatMonth(chartData[0].date);
        const endLabel = formatMonth(chartData[chartData.length - 1].date);

        return { range, startLabel, endLabel };
    }, [chartData]);

    if (!pairConfig.hasLiveTelemetry) {
        return (
            <div className="h-[360px] w-full bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center px-6">
                <p className="text-xs text-white/40 text-center m-0 max-w-md leading-relaxed">
                    {pairConfig.dataNote ?? 'Live spot telemetry unavailable for this pair.'}
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-[360px] w-full bg-white/[0.02] border border-white/10 rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    Loading spot series…
                </span>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="h-[360px] w-full bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center">
                <p className="text-xs text-white/40 m-0">Spot history unavailable for selected horizon.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">
                    Spot Rate &amp; Volatility Context
                </h2>
                <span className="text-[9px] font-black uppercase tracking-wider text-white/25">
                    {isIllustrative
                        ? 'Illustrative — live feed integration in progress'
                        : 'Live — RBI / FRED pipeline'}
                </span>
            </div>

            <div className="relative pl-6">
                <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-white/40 whitespace-nowrap origin-center"
                    aria-hidden
                >
                    USD/INR (₹ per USD)
                </span>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 24, right: 12, left: 4, bottom: 4 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                            minTickGap={40}
                            tickFormatter={(str: string) =>
                                new Date(str).toLocaleDateString(undefined, {
                                    month: 'short',
                                    year: '2-digit',
                                })
                            }
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                            domain={yDomain}
                            tickFormatter={(v: number) => `₹${v.toFixed(1)}`}
                            width={52}
                        />
                        <Tooltip
                            content={
                                <ChartTooltip
                                    pair={pair}
                                    regimeNote={regimeNote}
                                    volatilityRegime={volatilityRegime}
                                />
                            }
                        />
                        <Legend verticalAlign="top" align="right" iconType="plainline" />

                        <Area
                            type="monotone"
                            dataKey="volLower"
                            name="Volatility band (±1 std dev, illustrative)"
                            stackId="volBand"
                            stroke="none"
                            fill="transparent"
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="bandWidth"
                            stackId="volBand"
                            stroke="none"
                            fill="rgba(245, 158, 11, 0.12)"
                            isAnimationActive={false}
                        />

                        <Line
                            type="monotone"
                            dataKey="spot"
                            name="Spot USD/INR"
                            stroke="#B8860B"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {visibleEvents.map((event) => (
                            <ReferenceLine
                                key={event.date}
                                x={event.date}
                                stroke="rgba(255,255,255,0.25)"
                                strokeDasharray="4 4"
                                label={{
                                    value: event.label,
                                    position: 'insideTopLeft',
                                    fill: 'rgba(255,255,255,0.35)',
                                    fontSize: 8,
                                    fontWeight: 700,
                                }}
                            />
                        ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-[11px] text-white/40 mt-1 m-0">Date</p>
            </div>

            {interpretation ? (
                <p className="text-xs text-white/40 mt-3 px-1 m-0 leading-relaxed">
                    USD/INR has traded within a ₹{interpretation.range} band over the illustrated
                    period ({interpretation.startLabel}–{interpretation.endLabel}). FOMC decision
                    dates have not triggered sustained regime breaks under current RBI reserve
                    conditions.
                    {isIllustrative ? (
                        <span className="text-white/30">
                            {' '}
                            Illustrative — live feed integration in progress.
                        </span>
                    ) : null}
                </p>
            ) : null}

            {visibleEvents.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    {visibleEvents.map((event) => (
                        <span
                            key={event.date}
                            title={event.gqNote}
                            className="text-[9px] text-white/35 border border-white/8 rounded px-2 py-1 cursor-default"
                        >
                            {event.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};