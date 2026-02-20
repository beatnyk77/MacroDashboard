import React, { useMemo } from 'react';
import { useYieldCurves } from '@/hooks/useYieldCurves';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/* ── Tenor ordering for x-axis ────────────────────────────────── */
const TENOR_ORDER = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'];

/* ── Country palette ──────────────────────────────────────────── */
const COUNTRY_CONFIG: Record<string, { label: string; color: string; flag: string }> = {
    US: { label: 'United States', color: '#60a5fa', flag: '🇺🇸' },
    EU: { label: 'EU (Germany)', color: '#fbbf24', flag: '🇪🇺' },
    IN: { label: 'India', color: '#34d399', flag: '🇮🇳' },
    CN: { label: 'China', color: '#f87171', flag: '🇨🇳' },
};

const COUNTRIES = Object.keys(COUNTRY_CONFIG);

/* ── Helpers ──────────────────────────────────────────────────── */
interface CurvePoint {
    tenor: string;
    [key: string]: number | string | null; // US, EU, IN, CN
}

export const YieldCurveMonitor: React.FC = () => {
    const { data: rawData, isLoading } = useYieldCurves();

    // Build chart data: one row per tenor, columns for each country
    const { chartData, gauges, latestDate } = useMemo(() => {
        if (!rawData || rawData.length === 0)
            return { chartData: [] as CurvePoint[], gauges: {} as Record<string, any>, latestDate: '' };

        // Get the latest date per country+tenor
        const latestMap = new Map<string, typeof rawData[0]>();
        for (const row of rawData) {
            const key = `${row.country}_${row.tenor}`;
            const existing = latestMap.get(key);
            if (!existing || row.as_of_date > existing.as_of_date) {
                latestMap.set(key, row);
            }
        }

        // Build chart rows
        const points: CurvePoint[] = TENOR_ORDER.map(tenor => {
            const row: CurvePoint = { tenor };
            for (const c of COUNTRIES) {
                const d = latestMap.get(`${c}_${tenor}`);
                row[c] = d ? Number(d.yield_pct) : null;
            }
            return row;
        });

        // Compute gauge metrics per country
        const gMap: Record<string, any> = {};
        for (const c of COUNTRIES) {
            const y3m = latestMap.get(`${c}_3M`)?.yield_pct;
            const y2y = latestMap.get(`${c}_2Y`)?.yield_pct;
            const y10y = latestMap.get(`${c}_10Y`)?.yield_pct;
            const y30y = latestMap.get(`${c}_30Y`)?.yield_pct;

            const slope = y30y != null && y3m != null ? Number(y30y) - Number(y3m) : null;
            const spread2s10s = y10y != null && y2y != null ? Number(y10y) - Number(y2y) : null;
            const inverted = spread2s10s !== null && spread2s10s < 0;

            gMap[c] = {
                slope: slope !== null ? slope.toFixed(2) : '—',
                spread: spread2s10s !== null ? spread2s10s.toFixed(2) : '—',
                inverted,
                y10y: y10y != null ? Number(y10y).toFixed(2) : '—',
                source: latestMap.get(`${c}_10Y`)?.source || '—',
            };
        }

        // Latest date across all data
        let maxDate = '';
        for (const d of rawData) {
            if (d.as_of_date > maxDate) maxDate = d.as_of_date;
        }

        return { chartData: points, gauges: gMap, latestDate: maxDate };
    }, [rawData]);

    if (isLoading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Yield Curves...</span>
            </div>
        );
    }

    return (
        <SPASection id="yield-curve-monitor" className="py-24" disableAnimation>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                    <SectionHeader
                        title="Yield Curve Monitor"
                        subtitle="Government bond yield curves across major economies — inversion & steepening signals"
                    />
                    <div className="flex flex-wrap gap-4">
                        {COUNTRIES.map(c => {
                            const g = gauges[c];
                            if (!g) return null;
                            return (
                                <StatusChip
                                    key={c}
                                    label={`${COUNTRY_CONFIG[c].flag} ${c}`}
                                    status={g.inverted ? 'INVERTED' : 'NORMAL'}
                                    color={g.inverted ? 'rose' : 'emerald'}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Main grid: chart + gauges */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Hero Chart ───────────────────────────────────── */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                                    Sovereign Yield Curves
                                </h3>
                                <p className="text-[0.6rem] text-muted-foreground/60 mt-1">
                                    x = Tenor · y = Yield (%) · Lines = Countries
                                </p>
                            </div>
                            {latestDate && (
                                <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                    As of {new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-6 mb-4">
                            {COUNTRIES.map(c => (
                                <div key={c} className="flex items-center gap-2">
                                    <div className="w-3 h-[3px] rounded-full" style={{ backgroundColor: COUNTRY_CONFIG[c].color }} />
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/60">{COUNTRY_CONFIG[c].flag} {COUNTRY_CONFIG[c].label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="h-[420px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="tenor"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                                        tickFormatter={(val: number) => `${val.toFixed(1)}%`}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<CurveTooltip gauges={gauges} />} />
                                    {COUNTRIES.map(c => (
                                        <Line
                                            key={c}
                                            type="monotone"
                                            dataKey={c}
                                            name={COUNTRY_CONFIG[c].label}
                                            stroke={COUNTRY_CONFIG[c].color}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, strokeWidth: 0, fill: COUNTRY_CONFIG[c].color }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            connectNulls={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── Gauge Cards ──────────────────────────────────── */}
                    <div className="flex flex-col gap-6">
                        {COUNTRIES.map(c => {
                            const g = gauges[c];
                            if (!g) return null;
                            return (
                                <GaugeCard
                                    key={c}
                                    country={c}
                                    config={COUNTRY_CONFIG[c]}
                                    slope={g.slope}
                                    spread={g.spread}
                                    inverted={g.inverted}
                                    y10y={g.y10y}
                                    source={g.source}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Source footer */}
                <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-white/5">
                        <Info size={14} className="text-blue-400" />
                        <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest text-center">
                            Sources: FRED · ECB SDW · RBI DBIE — updated daily
                        </span>
                    </div>
                </div>
            </motion.div>
        </SPASection>
    );
};

/* ── Status Chip ──────────────────────────────────────────────── */
const StatusChip = ({ label, status, color }: { label: string; status: string; color: 'rose' | 'amber' | 'emerald' }) => (
    <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-start gap-1">
        <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest">{label}</span>
        <span className={cn(
            "text-[0.65rem] font-black uppercase tracking-tighter",
            color === 'rose' ? "text-rose-500" : color === 'amber' ? "text-amber-500" : "text-emerald-500"
        )}>{status}</span>
    </div>
);

/* ── Gauge Card ───────────────────────────────────────────────── */
const GaugeCard = ({ country, config, slope, spread, inverted, y10y, source }: {
    country: string;
    config: { label: string; color: string; flag: string };
    slope: string;
    spread: string;
    inverted: boolean;
    y10y: string;
    source: string;
}) => (
    <motion.div
        className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/10 transition-all group cursor-default"
        whileHover={{ y: -2 }}
    >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">{config.flag}</span>
                <span className="text-[0.65rem] font-black text-white/60 uppercase tracking-widest">{country}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-xl font-black tabular-nums" style={{ color: config.color }}>{y10y}%</span>
                <span className="text-[0.5rem] font-bold text-muted-foreground/40 uppercase">10Y</span>
            </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
            {/* Slope */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-400" />
                    <span className="text-[0.6rem] font-bold text-muted-foreground/60">Slope (30Y−3M)</span>
                </div>
                <span className={cn(
                    "text-sm font-black tabular-nums",
                    parseFloat(slope) > 0 ? "text-emerald-400" : parseFloat(slope) < 0 ? "text-rose-500" : "text-white/40"
                )}>
                    {slope !== '—' ? `${parseFloat(slope) > 0 ? '+' : ''}${slope}` : '—'}
                    <span className="text-[0.5rem] font-bold text-muted-foreground/40 ml-1">bps</span>
                </span>
            </div>

            {/* 2s10s Spread */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {inverted
                        ? <AlertTriangle size={14} className="text-rose-500" />
                        : <TrendingDown size={14} className="text-amber-400" />
                    }
                    <span className="text-[0.6rem] font-bold text-muted-foreground/60">2Y−10Y Spread</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-sm font-black tabular-nums",
                        inverted ? "text-rose-500" : "text-emerald-400"
                    )}>
                        {spread !== '—' ? `${parseFloat(spread) > 0 ? '+' : ''}${spread}` : '—'}
                    </span>
                    {inverted && (
                        <span className="text-[0.5rem] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 uppercase">
                            Inverted
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[0.5rem] font-black text-white/15 uppercase tracking-widest">{config.label}</span>
            <span className="text-[0.5rem] font-bold text-muted-foreground/30 uppercase">{source}</span>
        </div>
    </motion.div>
);

/* ── Custom Tooltip ───────────────────────────────────────────── */
const CurveTooltip = ({ active, payload, label, gauges }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-3xl min-w-[220px]">
                <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                    Tenor: {label}
                </div>
                <div className="space-y-2">
                    {payload
                        .filter((p: any) => p.value != null)
                        .map((p: any) => {
                            const countryCode = p.dataKey;
                            const cfg = COUNTRY_CONFIG[countryCode];
                            const gData = gauges?.[countryCode];
                            return (
                                <div key={countryCode} className="flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg?.color }} />
                                        <span className="text-[0.7rem] font-bold text-muted-foreground/80">{cfg?.flag} {countryCode}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[0.8rem] font-black tabular-nums text-white/90">
                                            {Number(p.value).toFixed(2)}%
                                        </span>
                                        {gData?.source && (
                                            <span className="text-[0.45rem] font-bold text-muted-foreground/30 uppercase">{gData.source}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    }
    return null;
};

export default YieldCurveMonitor;
