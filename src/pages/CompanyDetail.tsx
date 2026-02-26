import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const CompanyDetail: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();

    const { data: company, isLoading } = useQuery({
        queryKey: ['cie-company-detail', ticker],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('*, cie_fundamentals(*), cie_macro_signals(*)')
                .eq('ticker', `${ticker}.NS`)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!ticker
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black pt-24 px-6 flex items-center justify-center">
                <div className="animate-pulse space-y-4 w-full max-w-4xl">
                    <div className="h-12 w-1/3 bg-white/[0.02] rounded-xl" />
                    <div className="h-64 w-full bg-white/[0.02] rounded-2xl" />
                    <div className="grid grid-cols-3 gap-6">
                        <div className="h-32 bg-white/[0.02] rounded-2xl" />
                        <div className="h-32 bg-white/[0.02] rounded-2xl" />
                        <div className="h-32 bg-white/[0.02] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-black pt-24 px-6 flex flex-col items-center justify-center">
                <AlertTriangle size={48} className="text-white/20 mb-4" />
                <h1 className="text-2xl font-black text-white mb-2">Company Not Found</h1>
                <p className="text-white/40 mb-6 text-sm">We couldn't locate data for {ticker}</p>
                <Link to="/india-equities" className="text-blue-400 hover:text-blue-300 transition-colors">
                    &larr; Back to Screener
                </Link>
            </div>
        );
    }

    // Sort fundamentals chronological
    const sortedFunds = [...(company.cie_fundamentals || [])].sort((a, b) =>
        new Date(a.quarter_date).getTime() - new Date(b.quarter_date).getTime()
    );

    const chartData = sortedFunds.map(f => ({
        date: new Date(f.quarter_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: (f.revenue / 10000000).toFixed(0), // in Cr
        margin: (f.operating_margin * 100).toFixed(1)
    }));

    const latestFund = sortedFunds[sortedFunds.length - 1] || {};
    const latestSignal = company.cie_macro_signals?.[0] || {};
    const mcap = latestFund.metadata?.last_price ? (latestFund.revenue * latestFund.metadata.last_price / 1000) / 10000000 : 0;

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="mb-8">
                    <Link to="/india-equities" className="inline-flex items-center text-[0.65rem] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-6">
                        <ChevronLeft size={14} className="mr-1" /> Back to Screener
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">{company.name}</h1>
                                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/60">
                                    {company.ticker.replace('.NS', '')}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">{company.sector} &bull; {company.industry}</p>
                        </div>
                        <div className="flex gap-6 text-right">
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Market Cap</p>
                                <p className="text-2xl font-black">₹{mcap.toFixed(0)} <span className="text-sm text-white/40">Cr</span></p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Current Price</p>
                                <p className="text-2xl font-black text-blue-400">₹{latestFund.metadata?.last_price?.toFixed(2) || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <Activity size={16} className="mr-2 text-blue-400" /> Revenue Trend (Last 8 Quarters)
                            </h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickMargin={10} />
                                        <YAxis stroke="#ffffff20" fontSize={10} tickFormatter={(val) => `₹${val}c`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Quarters Table */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 overflow-x-auto">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6">Historical Fundamentals</h3>
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/30">Quarter</th>
                                        <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/30 text-right">Revenue (Cr)</th>
                                        <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/30 text-right">Net Profit (Cr)</th>
                                        <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/30 text-right">OPM %</th>
                                        <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/30 text-right">EPS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[...sortedFunds].reverse().map((fund, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium">{new Date(fund.quarter_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3 text-sm text-white/80 text-right">₹{(fund.revenue / 10000000).toFixed(0)}</td>
                                            <td className="px-4 py-3 text-sm text-white/80 text-right">₹{(fund.net_profit / 10000000).toFixed(0)}</td>
                                            <td className="px-4 py-3 text-sm text-white/80 text-right">{(fund.operating_margin * 100).toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-sm text-white/80 text-right">{fund.eps?.toFixed(2) || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Macro Context */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-2">Macro Impact Score</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className={`text-6xl font-black leading-none ${(latestSignal.macro_impact_score || 0) > 70 ? 'text-emerald-400' :
                                        (latestSignal.macro_impact_score || 0) > 50 ? 'text-amber-400' : 'text-rose-400'
                                    }`}>
                                    {latestSignal.macro_impact_score || 'N/A'}
                                </span>
                                <span className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">/ 100</span>
                            </div>
                            <p className="text-xs font-medium text-white/60 leading-relaxed">
                                This proprietary score evaluates the company's resilience to current macroeconomic shifts, including formalization trends and commodity cycles.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <TrendingUp size={16} className="mr-2" /> Macro Context Signals
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Formalization Premium</span>
                                        <span className="text-sm font-black text-amber-400">{latestSignal.formalization_premium?.toFixed(0) || 'N/A'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400" style={{ width: `${latestSignal.formalization_premium || 0}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">State Resilience</span>
                                        <span className="text-sm font-black text-emerald-400">{latestSignal.state_resilience?.toFixed(0) || 'N/A'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: `${latestSignal.state_resilience || 0}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Oil Sensitivity</span>
                                        <span className="text-sm font-black text-rose-400">{latestSignal.oil_sensitivity?.toFixed(0) || 'N/A'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-400" style={{ width: `${latestSignal.oil_sensitivity || 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default CompanyDetail;
