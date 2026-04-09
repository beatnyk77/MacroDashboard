import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, AreaChart, Area, ReferenceArea } from 'recharts';
import { Activity, Zap, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

// Types
interface TimeSeriesPoint {
    as_of_date: string;
    value: number;
}

interface CombinedDataPoint {
    date: string;
    holdings: number | null; // TREAST (Millions -> Trillions)
    debt: number | null;     // FDHBPIN (Billions -> Trillions)
    monetizationPct: number | null;
    yield10y: number | null; // DGS10
    tips10y: number | null;  // DFII10
    cpiYoy: number | null;   // CPI YoY %
    m2Yoy: number | null;    // M2 YoY %
    m2YoyLagged: number | null; // M2 YoY % lagged by 18 months
}

const QE_PERIODS = [
    { name: 'QE1', start: '2008-11-01', end: '2010-03-31', color: 'rgba(56, 189, 248, 0.15)' },
    { name: 'QE2', start: '2010-11-01', end: '2011-06-30', color: 'rgba(56, 189, 248, 0.15)' },
    { name: 'QE3', start: '2012-09-01', end: '2014-10-31', color: 'rgba(56, 189, 248, 0.15)' },
    { name: 'Pandemic QE', start: '2020-03-01', end: '2022-03-31', color: 'rgba(56, 189, 248, 0.25)' },
];

export const FedMonetizationMonitor: React.FC = () => {
    const [data, setData] = useState<CombinedDataPoint[]>([]);
    const [latestGauge, setLatestGauge] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateYoY = (tsData: TimeSeriesPoint[]) => {
            // Sort descending
            const sorted = [...tsData].sort((a, b) => new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime());
            return sorted.map((point) => {
                const currentDate = new Date(point.as_of_date);
                const targetPrevDate = new Date(currentDate);
                targetPrevDate.setFullYear(targetPrevDate.getFullYear() - 1);
                
                // Find closest data point 1 year ago (allow 30 days leeway)
                const prevPoint = sorted.find(p => {
                    const diff = Math.abs(new Date(p.as_of_date).getTime() - targetPrevDate.getTime());
                    return diff <= 30 * 24 * 60 * 60 * 1000;
                });

                const value = prevPoint && prevPoint.value !== 0 
                    ? ((point.value - prevPoint.value) / prevPoint.value) * 100 
                    : null;
                return { as_of_date: point.as_of_date, value };
            }).filter(p => p.value !== null) as TimeSeriesPoint[];
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch relevant metrics
                const metricsToFetch = [
                    'FED_TREASURY_HOLDINGS', // TREAST (Millions USD)
                    'US_DEBT_HELD_BY_PUBLIC', // FDHBPIN (Billions USD)
                    'US_TIPS_10Y_YIELD', // DFII10 (%)
                    'US_CPI_INDEX', // CPIAUCSL (Index)
                    'US_M2', // M2SL (Billions USD) - Assuming US_M2 exists
                ];

                const promises = metricsToFetch.map(metric_id => 
                    supabase
                        .from('metric_observations')
                        .select('as_of_date, value')
                        .eq('metric_id', metric_id)
                        .gte('as_of_date', '2005-01-01')
                        .order('as_of_date', { ascending: true })
                );

                // Also fetch 10Y yields from yield_curves or metric_observations
                const dgs10Promise = supabase
                    .from('metric_observations')
                    .select('as_of_date, value')
                    .eq('metric_id', 'US_DGS10') // Assuming this metric ID
                    .gte('as_of_date', '2005-01-01')
                    .order('as_of_date', { ascending: true });

                const results = await Promise.all([...promises, dgs10Promise]);
                
                const [
                    { data: treastData }, 
                    { data: fdhbpinData }, 
                    { data: tipsData }, 
                    { data: cpiData }, 
                    { data: m2Data },
                    { data: dgs10Data }
                ] = results;

                // Process CPI and M2 into YoY arrays
                const cpiYoyData = cpiData ? calculateYoY(cpiData) : [];
                const m2YoyData = m2Data ? calculateYoY(m2Data) : [];

                // Combine data chronologically by month
                const datemap = new Map<string, CombinedDataPoint>();

                const getMonthKey = (dateStr: string) => dateStr.substring(0, 7); // YYYY-MM

                // Initialize map with all dates
                const allDatasets = [treastData, fdhbpinData, tipsData, cpiYoyData, m2YoyData, dgs10Data];
                allDatasets.forEach(dataset => {
                    dataset?.forEach(d => {
                        const mk = getMonthKey(d.as_of_date);
                        if (!datemap.has(mk)) {
                            datemap.set(mk, {
                                date: mk + '-01',
                                holdings: null,
                                debt: null,
                                monetizationPct: null,
                                yield10y: null,
                                tips10y: null,
                                cpiYoy: null,
                                m2Yoy: null,
                                m2YoyLagged: null
                            });
                        }
                    });
                });

                // Populate Map
                treastData?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.holdings = d.value / 1_000_000; // mn to tn
                });
                fdhbpinData?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.debt = d.value / 1_000; // bn to tn
                });
                tipsData?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.tips10y = d.value;
                });
                dgs10Data?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.yield10y = d.value;
                });
                cpiYoyData?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.cpiYoy = d.value;
                });
                m2YoyData?.forEach(d => {
                    const mk = getMonthKey(d.as_of_date);
                    if (datemap.has(mk)) datemap.get(mk)!.m2Yoy = d.value;
                });

                let combinedArray = Array.from(datemap.values()).sort((a, b) => a.date.localeCompare(b.date));

                // Forward fill missing values
                let lastHoldings = 0, lastDebt = 0, lastYield = 0, lastTips = 0, lastCpi = 0, lastM2 = 0;
                combinedArray.forEach(d => {
                    if (d.holdings !== null) lastHoldings = d.holdings; else d.holdings = lastHoldings || null;
                    if (d.debt !== null) lastDebt = d.debt; else d.debt = lastDebt || null;
                    if (d.yield10y !== null) lastYield = d.yield10y; else d.yield10y = lastYield || null;
                    if (d.tips10y !== null) lastTips = d.tips10y; else d.tips10y = lastTips || null;
                    if (d.cpiYoy !== null) lastCpi = d.cpiYoy; else d.cpiYoy = lastCpi || null;
                    if (d.m2Yoy !== null) lastM2 = d.m2Yoy; else d.m2Yoy = lastM2 || null;

                    if (d.holdings && d.debt && d.debt > 0) {
                        d.monetizationPct = (d.holdings / d.debt) * 100;
                    }
                });

                // Calculate Lagged M2
                for (let i = 18; i < combinedArray.length; i++) {
                    combinedArray[i].m2YoyLagged = combinedArray[i - 18].m2Yoy;
                }

                setData(combinedArray);

                if (combinedArray.length > 0) {
                    const latest = combinedArray[combinedArray.length - 1];
                    setLatestGauge(latest.monetizationPct);
                }

            } catch (error) {
                console.error('Error fetching monetization data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl">
                <div className="animate-pulse text-slate-400">Loading Fed Monetization Data...</div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl z-50">
                    <p className="text-slate-300 font-semibold mb-2 border-b border-slate-700 pb-1">{label}</p>
                    {payload.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: p.color }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                                {p.name}
                            </span>
                            <span className="text-white font-mono text-sm">
                                {p.value?.toFixed(2)}{p.dataKey.includes('Pct') || p.dataKey.includes('Yoy') || p.dataKey.includes('ield') ? '%' : 'T'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const formatXAxis = (tickItem: string) => {
        const d = new Date(tickItem);
        return `${d.getFullYear()}`;
    };

    return (
        <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 p-6 md:p-8 space-y-8">
            <header className="border-b border-slate-700/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500" />
                        FED Debt Monetization & Yield Control
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base">
                        Tracking the Federal Reserve's footprint in sovereign US debt, resulting yield suppression, and inflationary consequences.
                    </p>
                </div>
                {latestGauge !== null && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-w-[200px]">
                        <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Monetization Gauge</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-blue-400 font-mono">{latestGauge.toFixed(1)}%</span>
                        </div>
                        <span className="text-slate-500 text-[10px] uppercase mt-1">Fed Ownership of Marketable Debt</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Module 1: Monetization Gauge & Trend */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 md:p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-400 w-5 h-5" />
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">Monetization Trend</h3>
                    </div>
                    <div className="h-64 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMonetization" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tickFormatter={formatXAxis} minTickGap={30} tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="monetizationPct" name="Debt Monetized" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMonetization)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 h-8">
                        The percentage of US marketable debt held directly on the Federal Reserve balance sheet. Growth indicates structural monetization.
                    </p>
                </div>

                {/* Module 2: Yield Suppression */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 md:p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingDown className="text-emerald-400 w-5 h-5" />
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">Yield Suppression Mechanism</h3>
                    </div>
                    <div className="h-64 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.filter(d => d.yield10y !== null && d.holdings !== null)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tickFormatter={formatXAxis} minTickGap={30} tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fill: '#3b82f6', fontSize: 11 }} tickFormatter={(val) => `$${val}T`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line yAxisId="left" type="monotone" dataKey="holdings" name="Fed Holdings" stroke="#3b82f6" dot={false} strokeWidth={2} />
                                <Line yAxisId="right" type="stepAfter" dataKey="yield10y" name="10Y Yield" stroke="#10b981" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 h-8">
                        Demonstrates the inverse relationship between Central Bank asset purchases (balance sheet expansion) and sovereign bond yields.
                    </p>
                </div>

                {/* Module 3: Inflation Transmission */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 md:p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-amber-400 w-5 h-5" />
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">Inflation Transmission (18m Lag)</h3>
                    </div>
                    <div className="h-64 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.filter(d => d.cpiYoy !== null && d.m2YoyLagged !== null)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tickFormatter={formatXAxis} minTickGap={30} tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Line type="monotone" dataKey="cpiYoy" name="CPI YoY" stroke="#ef4444" dot={false} strokeWidth={2} />
                                <Line type="monotone" dataKey="m2YoyLagged" name="M2 YoY (18m Lead)" stroke="#f59e0b" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 h-8">
                        The delayed transmission of broad money creation (M2) into consumer price inflation. M2 growth is shifted forward 18 months.
                    </p>
                </div>

                {/* Module 4: Real Yield Reality */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 md:p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-cyan-400 w-5 h-5" />
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm">Real Yields vs QE Regimes</h3>
                    </div>
                    <div className="h-64 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.filter(d => d.tips10y !== null)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tickFormatter={formatXAxis} minTickGap={30} tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                {QE_PERIODS.map(period => (
                                    <ReferenceArea 
                                        key={period.name}
                                        x1={period.start} 
                                        x2={period.end} 
                                        fill={period.color} 
                                        fillOpacity={1}
                                        label={{ value: period.name, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10 }}
                                    />
                                ))}
                                <ReferenceArea y1={0} y2={-5} fill="rgba(239, 68, 68, 0.1)" />
                                <Area type="stepAfter" dataKey="tips10y" name="10Y TIPS (Real Yield)" stroke="#06b6d4" fillOpacity={0} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 h-8">
                        10-Year TIPS reveals the true cost of sovereign debt. Shaded regions denote major Quantitative Easing periods driving yields deeply negative.
                    </p>
                </div>
            </div>
        </section>
    );
};
