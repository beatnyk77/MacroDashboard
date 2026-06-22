import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceArea,
    Legend,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { JargonTooltip } from './JargonTooltip';
import {
    buildPayoffTable,
    calculateCollarMetrics,
    generateCollarPayoffData,
} from '../lib/collarPayoff';
import { estimateForwardRate, getPairConfig, TIME_HORIZONS } from '../constants/currencyPairs';
import { formatInrIndian } from '../lib/formatInr';
import type { CollarHandoffParams } from '../lib/invoicingTypes';
import type { CollarPayoffPoint, Role, TimeHorizon, CurrencyPair } from '../lib/tradeFxTypes';

const ONBOARDING_STEPS = [
    {
        step: '1',
        text: 'Set your USD notional and comfort zone (floor and cap strikes below).',
    },
    {
        step: '2',
        text: 'We overlay current spot and an illustrative forward rate for your horizon.',
    },
    {
        step: '3',
        text: 'Compare your effective INR rate if USD/INR ends anywhere in this range.',
    },
] as const;

const NOTIONAL_MIN = 100_000;
const NOTIONAL_MAX = 10_000_000;
const NOTIONAL_STEP = 100_000;

type ChartRow = CollarPayoffPoint;
type DiagramRole = 'exporter' | 'importer';

interface CollarPayoffDiagramProps {
    role: Role;
    pair: CurrencyPair;
    horizon: TimeHorizon;
    spot: number | null;
    forwardRate: number | null;
    regimeNote: string;
    externalNotional?: number;
    externalPreFill?: CollarHandoffParams | null;
    preFillNonce?: number;
}

const CollarTooltip: React.FC<{
    active?: boolean;
    payload?: { payload: ChartRow }[];
    forwardRate: number;
    regimeNote: string;
}> = ({ active, payload, forwardRate, regimeNote }) => {
    if (!active || !payload?.[0]?.payload) return null;
    const row = payload[0].payload;
    const vsForward =
        forwardRate > 0 ? ((row.zeroCollar - forwardRate) / forwardRate) * 100 : 0;

    return (
        <div className="bg-slate-950/95 border border-white/10 rounded-lg px-3 py-2 text-[11px] max-w-[220px]">
            <div className="font-mono text-white/70 mb-1">
                Spot at maturity: ₹{row.spotAtMaturity.toFixed(2)}
            </div>
            <div className="text-white/45">Unhedged: ₹{row.unhedged.toFixed(2)}</div>
            <div className="text-blue-400">Forward: ₹{row.forwardHedge.toFixed(2)}</div>
            <div className="text-[#B8860B] font-bold">
                Zero-cost collar: ₹{row.zeroCollar.toFixed(2)}
            </div>
            <div className="text-white/35 mt-1">
                vs forward: {vsForward > 0 ? '+' : ''}
                {vsForward.toFixed(2)}%
            </div>
            {regimeNote ? (
                <div className="text-white/30 mt-1.5 pt-1.5 border-t border-white/10 leading-snug">
                    {regimeNote}
                </div>
            ) : null}
        </div>
    );
};

function roleCaption(diagramRole: DiagramRole): string {
    if (diagramRole === 'exporter') {
        return 'Exporter view: put floor protects receivables; call cap limits INR depreciation upside participation.';
    }
    return 'Importer view: call cap limits payable rate escalation; put floor forfeits savings if INR appreciates sharply.';
}

interface CollarPayoffChartProps {
    diagramRole: DiagramRole;
    pair: CurrencyPair;
    horizon: TimeHorizon;
    spot: number;
    resolvedForward: number;
    regimeNote: string;
    showPerspectiveToggle: boolean;
    initialNotional: number;
    initialFloor?: number;
    initialCap?: number;
    showPreFillHighlight?: boolean;
    onDiagramRoleChange: (role: DiagramRole) => void;
}

function buildRoleTableNote(
    diagramRole: DiagramRole,
    floorStrike: number,
    notionalFC: number,
): string {
    const floorReceipt = formatInrIndian(floorStrike * notionalFC, false);
    if (diagramRole === 'exporter') {
        return `For exporters: collar guarantees minimum ${floorReceipt} receipt even if USD/INR falls to floor.`;
    }
    return `For importers (call ceiling structure): collar caps maximum ${floorReceipt} payable cost.`;
}

const CollarPayoffChart: React.FC<CollarPayoffChartProps> = ({
    diagramRole,
    pair,
    horizon,
    spot,
    resolvedForward,
    regimeNote,
    showPerspectiveToggle,
    initialNotional,
    initialFloor,
    initialCap,
    showPreFillHighlight = false,
    onDiagramRoleChange,
}) => {
    const pairConfig = getPairConfig(pair);
    const horizonDays = TIME_HORIZONS.find((h) => h.id === horizon)?.days ?? 90;

    const [floorStrike, setFloorStrike] = useState(() =>
        Number((initialFloor ?? spot * 0.97).toFixed(2)),
    );
    const [capStrike, setCapStrike] = useState(() =>
        Number((initialCap ?? spot * 1.03).toFixed(2)),
    );
    const [notionalFC, setNotionalFC] = useState(() =>
        Math.min(Math.max(initialNotional, NOTIONAL_MIN), NOTIONAL_MAX),
    );

    const collarParams = useMemo(
        () => ({
            currentSpot: spot,
            forwardRate: resolvedForward,
            floorStrike,
            capStrike,
            notionalFC,
            horizonDays,
        }),
        [spot, resolvedForward, floorStrike, capStrike, notionalFC, horizonDays],
    );

    const chartData = useMemo(() => generateCollarPayoffData(collarParams), [collarParams]);
    const metrics = useMemo(() => calculateCollarMetrics(collarParams), [collarParams]);
    const payoffTable = useMemo(() => buildPayoffTable(collarParams), [collarParams]);

    const floorBounds = { min: spot * 0.92, max: spot * 0.99 };
    const capBounds = { min: spot * 1.01, max: spot * 1.12 };

    return (
        <div className={cn(showPreFillHighlight && 'ring-2 ring-amber-400/50 rounded-xl transition-shadow duration-500')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {ONBOARDING_STEPS.map(({ step, text }) => (
                    <div key={step} className="flex gap-2 items-start">
                        <span className="text-xs font-mono text-amber-400/60 border border-amber-400/20 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            {step}
                        </span>
                        <p className="text-xs text-white/40 leading-relaxed m-0">{text}</p>
                    </div>
                ))}
            </div>

            {showPerspectiveToggle ? (
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        Payoff perspective
                    </span>
                    <div className="flex gap-2">
                        {(['exporter', 'importer'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => onDiagramRoleChange(option)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
                                    diagramRole === option
                                        ? option === 'exporter'
                                            ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40'
                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                        : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5',
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <p className="text-[11px] text-white/45 m-0 italic">{roleCaption(diagramRole)}</p>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="spotAtMaturity"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                            tickFormatter={(v: number) => `₹${v.toFixed(1)}`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                            tickFormatter={(v: number) => `₹${v.toFixed(1)}`}
                            width={48}
                        />
                        <Tooltip
                            content={
                                <CollarTooltip
                                    forwardRate={resolvedForward}
                                    regimeNote={regimeNote}
                                />
                            }
                        />
                        <Legend verticalAlign="top" align="right" iconType="line" />

                        <ReferenceArea
                            x1={floorStrike}
                            x2={capStrike}
                            fill="rgba(184, 134, 11, 0.08)"
                            strokeOpacity={0}
                        />
                        <ReferenceLine
                            x={spot}
                            stroke="rgba(255,255,255,0.35)"
                            strokeDasharray="4 4"
                            label={{
                                value: 'Current spot',
                                position: 'insideTopLeft',
                                fill: 'rgba(255,255,255,0.4)',
                                fontSize: 9,
                            }}
                        />

                        <Line
                            type="monotone"
                            dataKey="unhedged"
                            name="Unhedged"
                            stroke="rgba(255,255,255,0.35)"
                            strokeDasharray="5 5"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="forwardHedge"
                            name="Forward"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="zeroCollar"
                            name="Zero-cost collar"
                            stroke="#B8860B"
                            strokeWidth={2.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-white/5 pt-5">
                <SliderControl
                    label={
                        diagramRole === 'importer'
                            ? 'Protection ceiling (call)'
                            : 'Protection floor (put)'
                    }
                    value={floorStrike}
                    min={floorBounds.min}
                    max={floorBounds.max}
                    step={0.05}
                    display={`₹${floorStrike.toFixed(2)}`}
                    onChange={setFloorStrike}
                />
                <SliderControl
                    label={diagramRole === 'importer' ? 'Savings floor (put)' : 'Upside cap (call)'}
                    value={capStrike}
                    min={capBounds.min}
                    max={capBounds.max}
                    step={0.05}
                    display={`₹${capStrike.toFixed(2)}`}
                    onChange={setCapStrike}
                />
                <SliderControl
                    label={`Notional (${pairConfig.baseCurrency})`}
                    value={notionalFC}
                    min={NOTIONAL_MIN}
                    max={NOTIONAL_MAX}
                    step={NOTIONAL_STEP}
                    display={`${(notionalFC / 1e6).toFixed(2)}M`}
                    onChange={setNotionalFC}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricTile
                    label="Protected floor"
                    value={`₹${metrics.protectedFloor.toFixed(2)}/USD`}
                    sub={formatInrIndian(metrics.protectedFloor * notionalFC, false)}
                />
                <MetricTile
                    label="Capped at"
                    value={`₹${metrics.cappedAt.toFixed(2)}/USD`}
                    sub={formatInrIndian(metrics.cappedAt * notionalFC, false)}
                />
                <MetricTile
                    label={
                        <>
                            <JargonTooltip term="participation zone">Participation zone</JargonTooltip>
                        </>
                    }
                    value={`₹${metrics.participationZone[0].toFixed(2)} – ₹${metrics.participationZone[1].toFixed(2)}`}
                    sub="Spot range with full participation"
                />
                <MetricTile
                    label="Vs forward (net)"
                    value={`${metrics.breakEvenVsForward >= 0 ? '+' : ''}${metrics.breakEvenVsForward.toFixed(2)} INR`}
                    sub="Zero net premium target"
                />
            </div>

            <div className="mt-6">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 m-0">
                    Payoff at Key Spot Levels — Illustrative
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-white/40">
                                <th className="text-left py-2 pr-4 font-medium">Scenario</th>
                                <th className="text-right py-2 pr-4 font-medium">Spot at Maturity</th>
                                <th className="text-right py-2 pr-4 font-medium">Unhedged (₹)</th>
                                <th className="text-right py-2 pr-4 font-medium">Forward (₹)</th>
                                <th className="text-right py-2 pr-4 font-medium">Collar (₹)</th>
                                <th className="text-right py-2 font-medium">vs Unhedged</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payoffTable.map((row) => (
                                <tr
                                    key={row.label}
                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                >
                                    <td className="py-2 pr-4 text-white/70">{row.label}</td>
                                    <td className="py-2 pr-4 text-right font-mono">
                                        ₹{row.spotAtMaturity.toFixed(2)}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono text-white/45">
                                        {formatInrIndian(row.unhedgedINR, false)}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono text-blue-400">
                                        {formatInrIndian(row.forwardINR, false)}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono text-[#B8860B]">
                                        {formatInrIndian(row.collarINR, false)}
                                    </td>
                                    <td
                                        className={cn(
                                            'py-2 text-right font-mono',
                                            row.diffVsUnhedged >= 0
                                                ? 'text-emerald-400'
                                                : 'text-rose-400',
                                        )}
                                    >
                                        {row.diffVsUnhedged >= 0 ? '+' : ''}
                                        {formatInrIndian(row.diffVsUnhedged, false)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-white/30 mt-2 m-0">
                    All figures illustrative. INR based on USD {(notionalFC / 1_000_000).toFixed(2)}M
                    notional. Collar payoff excludes bid/offer spread and credit terms.
                </p>
                <p className="text-xs text-white/40 mt-2 m-0">
                    {buildRoleTableNote(diagramRole, floorStrike, notionalFC)}
                </p>
            </div>

            <p className="text-[10px] text-white/35 m-0 leading-relaxed">{regimeNote}</p>
        </div>
    );
};

export const CollarPayoffDiagram: React.FC<CollarPayoffDiagramProps> = ({
    role,
    pair,
    horizon,
    spot,
    forwardRate,
    regimeNote,
    externalNotional,
    externalPreFill,
    preFillNonce,
}) => {
    const pairConfig = getPairConfig(pair);
    const resolvedForward = forwardRate ?? (spot !== null ? estimateForwardRate(spot, horizon) : null);
    const [balancedPerspective, setBalancedPerspective] = useState<DiagramRole>('exporter');

    const diagramRole: DiagramRole =
        role === 'balanced' ? balancedPerspective : role === 'importer' ? 'importer' : 'exporter';

    if (!pairConfig.hasLiveTelemetry || spot === null || resolvedForward === null) {
        return (
            <section className="border border-white/10 bg-white/[0.02] rounded-2xl px-5 py-8 text-center">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-2">
                    Zero-Cost Collar Payoff
                </h2>
                <p className="text-xs text-white/40 m-0">
                    Payoff diagram requires live USD/INR spot. Select USD/INR to structure an
                    illustrative collar.
                </p>
            </section>
        );
    }

    return (
        <section
            id="collar-payoff"
            className="border border-white/10 bg-white/[0.02] rounded-2xl p-4 md:p-6 space-y-5"
        >
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-1">
                    Zero-Cost Collar Payoff Analysis
                </h2>
                <p className="text-[11px] text-white/40 m-0 leading-relaxed">
                    Illustrative{' '}
                    <JargonTooltip term="zero-cost collar">zero-cost collar</JargonTooltip> —
                    effective INR/{pairConfig.baseCurrency} rate at maturity.
                </p>
            </div>

            <CollarPayoffChart
                key={`${spot}-${horizon}-${externalNotional ?? 1_000_000}-${preFillNonce ?? 0}`}
                diagramRole={diagramRole}
                pair={pair}
                horizon={horizon}
                spot={spot}
                resolvedForward={resolvedForward}
                regimeNote={regimeNote}
                showPerspectiveToggle={role === 'balanced'}
                initialNotional={
                    externalPreFill?.notionalFC ?? externalNotional ?? 1_000_000
                }
                initialFloor={externalPreFill?.suggestedFloor}
                initialCap={externalPreFill?.suggestedCap}
                showPreFillHighlight={(preFillNonce ?? 0) > 0}
                onDiagramRoleChange={setBalancedPerspective}
            />
        </section>
    );
};

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    display: string;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, display, onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                {label}
            </span>
            <span className="text-xs font-mono text-[#B8860B]">{display}</span>
        </div>
        <Slider
            min={min}
            max={max}
            step={step}
            value={[value]}
            onValueChange={([v]) => onChange(Number(v.toFixed(2)))}
            className="py-1"
        />
    </div>
);

const MetricTile: React.FC<{
    label: React.ReactNode;
    value: string;
    sub: string;
    className?: string;
}> = ({ label, value, sub, className }) => (
    <div className={cn('rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5', className)}>
        <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">
            {label}
        </div>
        <div className="text-xs font-mono font-bold text-white/80">{value}</div>
        <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>
    </div>
);