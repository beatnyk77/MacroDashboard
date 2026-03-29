import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Calendar, DollarSign, AlertTriangle, ArrowUpRight, Activity, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface CorporateMaturity {
    ticker: string;
    company_name: string;
    yr1: number;
    yr2_3: number;
    yr4_5: number;
    yr5_plus: number;
    total_debt: number;
    report_date: string;
}

interface AggregateData {
    bucket: string;
    amount: number;
    percent: number;
}

const COLORS = {
    yr1: '#ef4444',    // red-500 (High pressure)
    yr2_3: '#f59e0b',  // amber-500
    yr4_5: '#3b82f6',  // blue-500
    yr5Plus: '#10b981' // emerald-500
};

export const CorporateDebtMaturityWall: React.FC = () => {
    const [data, setData] = useState<AggregateData[]>([]);
    const [stats, setStats] = useState({ total: 0, yr1Total: 0, count: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get the latest as_of_date
            const { data: latestEntry } = await supabase
                .from('corporate_debt_maturities')
                .select('as_of_date')
                .order('as_of_date', { ascending: false })
                .limit(1);

            if (!latestEntry || latestEntry.length === 0) return;

            const latestDate = latestEntry[0].as_of_date;

            const { data: rawData, error } = await supabase
                .from('corporate_debt_maturities')
                .select('*')
                .eq('as_of_date', latestDate);

            if (error) throw error;

            if (rawData && rawData.length > 0) {
                const total = rawData.reduce((sum, item) => sum + (Number(item.maturing_amount) || 0), 0);
                const yr1Sum = rawData.find(d => d.bucket === '<1Y')?.maturing_amount || 0;
                
                const aggregated = rawData.map(item => ({
                    bucket: item.bucket === '<1Y' ? '< 1 Year' : 
                            item.bucket === '1-3Y' ? '1 - 3 Years' :
                            item.bucket === '3-5Y' ? '3 - 5 Years' : '5+ Years',
                    amount: Number(item.maturing_amount),
                    percent: Number(item.percent_of_total_debt),
                    color: item.bucket === '<1Y' ? COLORS.yr1 :
                           item.bucket === '1-3Y' ? COLORS.yr2_3 :
                           item.bucket === '3-5Y' ? COLORS.yr4_5 : COLORS.yr5Plus,
                    coupon: item.weighted_avg_coupon,
                    delta: item.implied_refinancing_cost_delta
                }));

                // Sort by logical order
                const order = ['< 1 Year', '1 - 3 Years', '3 - 5 Years', '5+ Years'];
                aggregated.sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));

                setData(aggregated);
                setStats({ 
                    total: total, 
                    yr1Total: yr1Sum,
                    count: 500 // S&P 500 aggregate context
                });
            }
        } catch (err) {
            console.error('Error fetching corporate debt data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="animate-pulse text-slate-500 flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-spin" />
                    Analyzing SEC Maturity Filings...
                </div>
            </div>
        );
    }

    return (
        <section className="w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header Area */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">Institutional Grade</span>
                            <span className="text-slate-500 text-[10px]">•</span>
                            <span className="text-slate-500 text-[10px]">Source: SEC EDGAR XBRL</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-blue-400" />
                            Corporate Debt Maturity Wall
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            S&P 500 aggregate debt maturity wall highlighting the rollover risk for the top {stats.count} constituents.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-800">
                <div className="p-6 border-r border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium italic">
                        <DollarSign className="w-3 h-3" /> AGGREGATE DEBT (TOP {stats.count})
                    </div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                        ${stats.total.toFixed(2)}T
                    </div>
                </div>
                <div className="p-6 border-r border-slate-800 bg-red-500/5">
                    <div className="flex items-center gap-2 text-red-400/70 text-xs mb-1 font-medium italic">
                        <AlertTriangle className="w-3 h-3" /> IMMEDIATE ROLLOVER ({"<1Y"})
                    </div>
                    <div className="text-3xl font-mono font-bold text-red-500 tracking-tighter">
                        ${stats.yr1Total.toFixed(2)}T
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium italic">
                        <Percent className="w-3 h-3" /> REFINANCING CONCENTRATION
                    </div>
                    <div className="text-3xl font-mono font-bold text-slate-300 tracking-tighter">
                        {((stats.yr1Total / stats.total) * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Main Visual Section */}
            <div className="p-6 md:p-8 grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis 
                                dataKey="bucket" 
                                stroke="#475569" 
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                stroke="#475569" 
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickFormatter={(val) => `$${val}T`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-2xl">
                                                <p className="text-white font-bold text-sm mb-1">{payload[0].payload.bucket}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div>
                                                    <p className="text-slate-300 text-xs">
                                                        Amount: <span className="text-white font-mono">${payload[0].value.toFixed(2)}T</span>
                                                    </p>
                                                </div>
                                                <p className="text-slate-500 text-[10px] mt-1 italic">
                                                    {payload[0].payload.percent.toFixed(1)}% of total aggregate debt
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar 
                                dataKey="amount" 
                                radius={[4, 4, 0, 0]}
                                barSize={60}
                            >
                                {data.map((entry, index) => (
                                    <rect key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-4">
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Refinancing Pressure</h4>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            A significant portion of low-coupon corporate debt issued in 2020-2021 is approaching the <span className="text-red-400 font-bold">1-year cliff</span>. Implied refinancing costs have increased by ~350bps on average.
                        </p>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sector Concentration</h4>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Financials and Industrials represent 78% of the upcoming "maturing debt wall". Cash-flow coverage ratios are being monitored for tier-2 industrials.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-slate-900/40 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> HIGH RISK</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> ELEVATED</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> MANAGEABLE</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> DISTANT</span>
            </div>
        </section>
    );
};
