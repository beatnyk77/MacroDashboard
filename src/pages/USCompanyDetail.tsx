import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, AlertTriangle, Activity, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';

export const USCompanyDetail: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();
    const [chartMetric, setChartMetric] = useState<'revenue' | 'net_income' | 'roe' | 'debt_equity' | 'operating_margin'>('revenue');

    const { data: company, isLoading } = useQuery({
        queryKey: ['us-company-detail', ticker],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_companies')
                .select('*, us_fundamentals(*), us_filings(*), us_insider_trades(*)')
                .eq('ticker', ticker)
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
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-black pt-24 px-6 flex flex-col items-center justify-center">
                <AlertTriangle size={48} className="text-white/20 mb-4" />
                <h1 className="text-2xl font-black text-white mb-2">Security Not Found</h1>
                <Link to="/us-equities" className="text-blue-400 hover:text-blue-300 transition-colors">
                    &larr; Back to Terminal
                </Link>
            </div>
        );
    }

    const sortedFunds = [...(company.us_fundamentals || [])].sort((a, b) =>
        new Date(a.period_end).getTime() - new Date(b.period_end).getTime()
    );

    const latestFund = sortedFunds[sortedFunds.length - 1] || {};

    const chartData = sortedFunds.map(f => ({
        date: format(new Date(f.period_end), 'MMM yy'),
        revenue: f.revenue ? Number((f.revenue / 1000000).toFixed(0)) : 0,
        net_income: f.net_income ? Number((f.net_income / 1000000).toFixed(0)) : 0,
        roe: f.roe ? Number((f.roe * 100).toFixed(1)) : 0,
        debt_equity: f.debt_equity ? Number(f.debt_equity.toFixed(2)) : 0,
        operating_margin: f.operating_margin ? Number((f.operating_margin * 100).toFixed(1)) : 0,
    }));

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <Link to="/us-equities" className="inline-flex items-center text-[0.65rem] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors mb-6">
                        <ChevronLeft size={14} className="mr-1" /> Back to Terminal
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">{company.name}</h1>
                                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xl font-black text-blue-400">
                                    {company.ticker}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">{company.sector || 'N/A'} &bull; {company.industry || 'N/A'}</p>
                        </div>
                        <div className="flex flex-wrap gap-6 text-right items-end">
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">CIK</p>
                                <p className="text-xl font-black text-white/60">{company.cik}</p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Fiscal Year End</p>
                                <p className="text-xl font-black">{company.fiscal_year_end || '12-31'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Financial Trends */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center">
                                    <TrendingUp size={16} className="mr-2 text-blue-400" /> Historical Performance
                                </h3>
                                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
                                    {['revenue', 'net_income', 'roe', 'debt_equity', 'operating_margin'].map(metric => (
                                        <button
                                            key={metric}
                                            onClick={() => setChartMetric(metric as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${chartMetric === metric ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                        >
                                            {metric.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickMargin={10} />
                                        <YAxis stroke="#ffffff20" fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey={chartMetric} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-4 text-[0.65rem] text-white/20 italic">* Values in Millions USD (except ratios)</p>
                        </div>

                        {/* Recent Filings */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <FileText size={16} className="mr-2 text-purple-400" /> SEC Filings (EDGAR Feed)
                            </h3>
                            <div className="space-y-3">
                                {company.us_filings?.length > 0 ? (
                                    company.us_filings.sort((a: any, b: any) => new Date(b.filing_date).getTime() - new Date(a.filing_date).getTime()).map((f: any) => (
                                        <a
                                            key={f.id}
                                            href={f.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest mr-3">
                                                        {f.form_type}
                                                    </span>
                                                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{f.description}</span>
                                                </div>
                                                <span className="text-[0.65rem] font-medium text-white/20">{format(new Date(f.filing_date), 'dd MMM yyyy')}</span>
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                                        <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No recent filings ingested.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Summary Ratios */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <BarChart3 size={16} className="mr-2 text-emerald-400" /> Current Valuation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-1">P/E Ratio</p>
                                    <p className="text-xl font-black">{latestFund.pe_ratio?.toFixed(1) || '—'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-1">P/B Ratio</p>
                                    <p className="text-xl font-black">{latestFund.pb_ratio?.toFixed(1) || '—'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-1">EV/EBITDA</p>
                                    <p className="text-xl font-black">{latestFund.ev_ebitda?.toFixed(1) || '—'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-1">FCF Yield</p>
                                    <p className="text-xl font-black text-emerald-400">{latestFund.fcf_yield ? `${(latestFund.fcf_yield * 100).toFixed(1)}%` : '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Insider Snapshot */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <Activity size={16} className="mr-2 text-rose-400" /> Insider Activity (LTM)
                            </h3>
                            {company.us_insider_trades?.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                        <span className="text-[0.65rem] font-bold uppercase text-emerald-400">Total Buying</span>
                                        <span className="text-sm font-black text-emerald-400">
                                            ${(company.us_insider_trades.filter((t: any) => t.transaction_type === 'BUY').reduce((acc: number, t: any) => acc + (t.total_value || 0), 0) / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                        <span className="text-[0.65rem] font-bold uppercase text-rose-400">Total Selling</span>
                                        <span className="text-sm font-black text-rose-400">
                                            ${(company.us_insider_trades.filter((t: any) => t.transaction_type === 'SELL').reduce((acc: number, t: any) => acc + (t.total_value || 0), 0) / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-black/20 rounded-2xl">
                                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No recent transactions.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default USCompanyDetail;
