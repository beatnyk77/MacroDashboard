import React, { useMemo } from 'react';
import { useYieldCurves } from '@/hooks/useYieldCurves';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/ui/card';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Info, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
                <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Yield Curves...</span>
            </div>
        );
    }

    return (
        <SPASection id="yield-curve-monitor" className="py-16" disableAnimation>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <SectionHeader
                        title="Yield Curve Monitor"
                        subtitle="Government bond yield curves across major economies — inversion & steepening signals"
                    />
                    <div className="flex flex-wrap gap-3">
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

                {/* Main container: full-width chart + gauge grid below */}
                <div className="flex flex-col gap-10">
                    {/* ── Hero Chart ───────────────────────────────────── */}
                    <Card variant="elevated" className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-uppercase">
                                    Sovereign Yield Curves
                                </h3>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    x = Tenor · y = Yield (%) · Lines = Countries
                                </p>
                            </div>
                            {latestDate && (
                                <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase">
                                    As of {new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 justify-center sm:justify-start">
                            {COUNTRIES.map(c => (
                                <div key={c} className="flex items-center gap-2">
                                    <div className="w-3 h-[3px] rounded-full" style={{ backgroundColor: COUNTRY_CONFIG[c].color }} />
                                    <span className="text-[11px] font-medium text-white/70">{COUNTRY_CONFIG[c].label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="h-[600px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="tenor"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontWeight: 500 }}
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
                                            strokeWidth={3}
                                            dot={{ r: 5, strokeWidth: 0, fill: COUNTRY_CONFIG[c].color }}
                                            activeDot={{ r: 7, strokeWidth: 0 }}
                                            connectNulls={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* ── Gauge Cards Grid ─────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="mt-10 flex justify-center">
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/5">
                        <Info size={13} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-uppercase text-center">
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
    <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-start gap-0.5">
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-uppercase">{label}</span>
        <span className={cn(
            "text-[11px] font-black uppercase tracking-heading",
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
    <motion.div whileHover={{ y: -2 }}>
        <Card variant="elevated" className="p-4 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:bg-white/[0.04] group cursor-default h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
                <span className="text-base">{config.flag}</span>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-uppercase">{country}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-lg font-black tabular-nums" style={{ color: config.color }}>{y10y}%</span>
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">10Y</span>
            </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
            {/* Slope */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-muted-foreground/60">Slope (30Y−3M)</span>
                </div>
                <span className={cn(
                    "text-xs font-black tabular-nums",
                    parseFloat(slope) > 0 ? "text-emerald-400" : parseFloat(slope) < 0 ? "text-rose-500" : "text-white/40"
                )}>
                    {slope !== '—' ? `${parseFloat(slope) > 0 ? '+' : ''}${slope}` : '—'}
                    <span className="text-[10px] font-bold text-muted-foreground/40 ml-1">bps</span>
                </span>
            </div>

            {/* Term Premium Glossary Link */}
            <Link to="/glossary/term-premium" className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-uppercase transition-colors">
                <BookOpen size={9} /> Term Premium
            </Link>

            {/* 2s10s Spread */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {inverted
                        ? <AlertTriangle size={12} className="text-rose-500" />
                        : <TrendingDown size={12} className="text-amber-400" />
                    }
                    <span className="text-[10px] font-bold text-muted-foreground/60">2Y−10Y</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "text-xs font-black tabular-nums",
                        inverted ? "text-rose-500" : "text-emerald-400"
                    )}>
                        {spread !== '—' ? `${parseFloat(spread) > 0 ? '+' : ''}${spread}` : '—'}
                    </span>
                    {inverted && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 uppercase">
                            Inv
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-white/15 uppercase tracking-uppercase">{config.label}</span>
            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase">{source}</span>
        </div>
    </Card>
</motion.div>
);

/* ── Custom Tooltip ───────────────────────────────────────────── */
const CurveTooltip = ({ active, payload, label, gauges }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/12 p-5 rounded-2xl shadow-3xl min-w-[220px]">
                <div className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-3 border-b border-white/5 pb-2">
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
                                        <span className="text-xs font-bold text-muted-foreground/80">{cfg?.flag} {countryCode}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black tabular-nums text-white/90">
                                            {Number(p.value).toFixed(2)}%
                                        </span>
                                        {gData?.source && (
                                            <span className="text-xs font-bold text-muted-foreground/30 uppercase">{gData.source}</span>
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
