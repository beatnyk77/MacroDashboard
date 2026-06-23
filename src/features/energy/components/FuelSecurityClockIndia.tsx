// src/features/energy/components/FuelSecurityClockIndia.tsx
import React, { useMemo } from 'react';
import { MotionCard } from '@/components/MotionCard';
import { DataStatePanel } from '@/components/DataStatePanel';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import {
    CHART_HEIGHTS,
    DEFAULT_CARTESIAN_GRID_PROPS,
    DEFAULT_TOOLTIP_STYLE,
} from '@/constants/chartDefaults';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
} from 'recharts';
import { useFuelSecurityIndia } from '../hooks/useFuelSecurityIndia';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Per-chokepoint risk: differentiated thresholds reflect India's actual import corridor exposure.
type ChokepointStatus = 'critical' | 'elevated' | 'normal';

const getChokepointStatus = (
    chokepoint: 'Hormuz' | 'Malacca' | 'Red Sea',
    geoScore: number,
    tankerPipeline: Array<{ origin: string; risk_flag: string }>,
): ChokepointStatus => {
    const exposed = tankerPipeline.filter(v => v.risk_flag === 'chokepoint_exposed');

    if (chokepoint === 'Hormuz') {
        let status: ChokepointStatus = geoScore > 65 ? 'critical' : geoScore > 35 ? 'elevated' : 'normal';
        if (status !== 'critical') {
            const gulfOrigins = ['Iraq', 'Iran', 'Saudi', 'Kuwait', 'UAE'];
            const hasGulfExposed = exposed.some(v => gulfOrigins.some(o => v.origin.includes(o)));
            if (hasGulfExposed && status === 'normal') status = 'elevated';
        }
        return status;
    }

    if (chokepoint === 'Malacca') {
        let status: ChokepointStatus = geoScore > 75 ? 'critical' : geoScore > 45 ? 'elevated' : 'normal';
        if (status !== 'critical') {
            const hasRuVzExposed = exposed.some(v => v.origin.includes('Russia') || v.origin.includes('Venezuela'));
            if (hasRuVzExposed && status === 'normal') status = 'elevated';
        }
        return status;
    }

    // Red Sea — tracks geo risk tightly (Houthi / Bab-el-Mandeb)
    return geoScore > 60 ? 'critical' : geoScore > 30 ? 'elevated' : 'normal';
};

const getRiskColor = (score: number): string => {
    if (score < 30) return '#10b981';
    if (score < 60) return '#f59e0b';
    return '#ef4444';
};

const getRiskLevel = (days: number): { label: string; colorClass: string } => {
    if (days >= 15) return { label: 'SAFE', colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (days >= 7) return { label: 'WATCH', colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'CRITICAL', colorClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
};

const projectionData = (base: number, disruption: number, rationing: number) => {
    const data = [];
    const today = new Date();
    for (let i = 0; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        data.push({
            date: date.toISOString().split('T')[0],
            baseline: Math.max(0, base - i * (base / 60)),
            disruption: Math.max(0, disruption - i * (disruption / 45)),
            rationing: Math.max(0, rationing - i * (rationing / 90)),
        });
    }
    return data;
};

const useIndiaImportOrigins = () =>
    useQuery({
        queryKey: ['india-import-origins'],
        queryFn: async (): Promise<{ origin: string; volume: number }[]> => {
            const { data, error } = await supabase
                .from('oil_imports_by_origin')
                .select('exporter_country_name, import_volume_mbbl')
                .eq('importer_country_code', 'IN')
                .order('import_volume_mbbl', { ascending: false });

            if (error) throw error;
            if (!data?.length) return [];

            const byOrigin = new Map<string, number>();
            for (const row of data) {
                const origin = row.exporter_country_name || 'Unknown';
                byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + Number(row.import_volume_mbbl));
            }

            return Array.from(byOrigin.entries())
                .map(([origin, volume]) => ({ origin, volume }))
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 8);
        },
        staleTime: 1000 * 60 * 60,
    });

export const FuelSecurityClockIndia: React.FC = () => {
    const { data: apiData, isError, refetch } = useFuelSecurityIndia();
    const { data: importOrigins = [] } = useIndiaImportOrigins();

    const projData = useMemo(() => {
        if (!apiData || apiData.scenario_baseline_days === null || apiData.scenario_disruption_days === null || apiData.scenario_rationing_days === null) {
            return [];
        }
        return projectionData(
            apiData.scenario_baseline_days,
            apiData.scenario_disruption_days,
            apiData.scenario_rationing_days,
        );
    }, [apiData]);

    if (isError || !apiData) {
        return (
            <MotionCard className="w-full" delay={0.35}>
                <DataStatePanel
                    variant={isError ? 'error' : 'empty'}
                    title={isError ? 'Fuel security feed unavailable' : 'Fuel security data pending'}
                    description="EIA International Energy Statistics / PPAC coverage data updates bi-weekly."
                    onRetry={isError ? () => refetch() : undefined}
                    height={400}
                    accentColor="amber"
                />
            </MotionCard>
        );
    }

    const data = apiData;

    return (
        <MotionCard className="w-full" delay={0.35}>
            {/* Header */}
            <div className="mb-8 pl-4 border-l-4 border-amber-500/30">
                <h3 className="text-2xl font-black text-white uppercase tracking-heading">
                    Fuel Security Clock – India
                </h3>
                <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
                    Strategic petroleum coverage, import origin concentration, and geopolitical stress scoring.
                </p>
                <p className="text-[10px] text-muted-foreground/30 mt-1 uppercase tracking-wide">
                    Source: EIA International Energy Statistics · PPAC India · FRED
                </p>
            </div>

            <div className="space-y-8">
                {/* Row 1: Countdown Clock + Official/Actual */}
                {data.reserves_days_coverage != null ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-8 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 backdrop-blur-sm">
                            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">
                                Reserves Coverage
                            </h4>
                            <div className="flex items-end gap-4">
                                <div className="text-8xl font-black italic tracking-tighter text-white">
                                    {Math.round(data.reserves_days_coverage)}
                                </div>
                                <div className="text-2xl font-black text-amber-500/60 mb-2">days</div>
                            </div>
                            <div className="mt-4">
                                <div className={cn(
                                    'px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider inline-block border',
                                    getRiskLevel(data.reserves_days_coverage).colorClass,
                                )}>
                                    {getRiskLevel(data.reserves_days_coverage).label}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground/40 mt-3 uppercase tracking-wide">
                                * Days of coverage = Total reserves / Daily consumption
                            </p>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">
                                Official vs Independent Estimate
                            </h4>
                            <MacroChartContainer height={CHART_HEIGHTS.standard}>
                                    <BarChart data={[
                                        { name: 'Official (PPAC)', value: data.reserves_days_official },
                                        { name: 'Actual (Est.)', value: data.reserves_days_actual },
                                    ]}>
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#f59e0b" />
                                        </Bar>
                                        <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} unit="d" />
                                        <Tooltip contentStyle={{ background: '#000000e0', border: '1px solid #ffffff10', borderRadius: 12, fontSize: 10 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {data.deviation_pct !== null && (
                                <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                                    Deviation:{' '}
                                    <span className={cn('font-black', data.deviation_pct > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                                        {data.deviation_pct > 0 ? '+' : ''}{data.deviation_pct.toFixed(1)}%
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                        <p className="text-sm text-muted-foreground">Reserves coverage data not yet available.</p>
                    </div>
                )}

                {/* Row 2: Import Origin Breakdown */}
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">
                        Import Origin Breakdown (Top 8 Suppliers)
                    </h4>
                    {importOrigins.length > 0 ? (
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={importOrigins} layout="vertical" margin={{ left: 100, right: 24 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} unit=" Mbbl" />
                                    <YAxis type="category" dataKey="origin" tick={{ fill: '#ffffff60', fontSize: 10 }} axisLine={false} tickLine={false} width={96} />
                                    <Tooltip contentStyle={{ background: '#000000e0', border: '1px solid #ffffff10', borderRadius: 12, fontSize: 10 }} />
                                    <Bar dataKey="volume" name="Volume (Mbbl)" radius={[0, 6, 6, 0]} fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl">
                            <span className="text-xs text-muted-foreground/40 uppercase tracking-wide">
                                Import origin data not yet available
                            </span>
                        </div>
                    )}
                </div>

                {/* Row 3: Brent-INR Cost + Geopolitical Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">
                            Import Cost Pressure (Local Currency)
                        </h4>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-white tracking-heading italic">
                                {data.inr_per_barrel?.toLocaleString('en-IN') || 'N/A'}
                            </span>
                            <span className="text-sm font-black text-blue-500/40 uppercase">INR/barrel</span>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-muted-foreground/40">Brent USD</span>
                            <span className="text-sm font-black text-white">${data.brent_price_usd?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 mt-3 uppercase tracking-wide">
                            * Higher INR/barrel widens current account deficit pressure
                        </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 backdrop-blur-sm">
                        <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4">
                            Geopolitical Risk Score
                        </h4>
                        <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <path
                                        d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8"
                                        fill="none"
                                        stroke={getRiskColor(data.geopolitical_risk_score)}
                                        strokeWidth="3"
                                        strokeDasharray={`${data.geopolitical_risk_score}, 100`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-black text-white">{data.geopolitical_risk_score}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {(['Hormuz', 'Malacca', 'Red Sea'] as const).map(chokepoint => {
                                    const status = getChokepointStatus(chokepoint, data.geopolitical_risk_score, data.tanker_pipeline_json ?? []);
                                    const subtitle = chokepoint === 'Hormuz'
                                        ? 'Gulf crude corridor (~50%)'
                                        : chokepoint === 'Malacca'
                                        ? 'East Africa / Russia legs'
                                        : 'Houthi / Bab-el-Mandeb';
                                    return (
                                        <div key={chokepoint} className="flex items-center justify-between text-xs">
                                            <div>
                                                <span className="text-muted-foreground/60 uppercase tracking-wider">{chokepoint}</span>
                                                <div className="text-[9px] text-muted-foreground/30 uppercase tracking-wide">{subtitle}</div>
                                            </div>
                                            <span className={cn(
                                                'font-black px-2 py-0.5 rounded text-[10px]',
                                                status === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                                                status === 'elevated' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-emerald-500/10 text-emerald-500',
                                            )}>
                                                {status === 'critical' ? 'Critical' : status === 'elevated' ? 'Elevated' : 'Normal'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 4: Consumption Projections */}
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">
                        Consumption Trajectory & Stress Scenarios
                    </h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={projData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickFormatter={d => {
                                        const date = new Date(d);
                                        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
                                    }}
                                />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} unit=" d" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    labelFormatter={label => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={3} dot={false} name="Baseline" />
                                <Line type="monotone" dataKey="disruption" stroke="#f59e0b" strokeWidth={3} dot={false} name="Disruption (−30% imports)" />
                                <Line type="monotone" dataKey="rationing" stroke="#ef4444" strokeWidth={3} dot={false} name="Rationing (−50% consumption)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </MotionCard>
    );
};

export default FuelSecurityClockIndia;
