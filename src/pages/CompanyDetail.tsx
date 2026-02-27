import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, AlertTriangle, Activity, ShieldAlert, Users, Briefcase } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

export const CompanyDetail: React.FC = () => {
    const { ticker } = useParams<{ ticker: string }>();
    const [chartMetric, setChartMetric] = useState<'revenue' | 'profit' | 'margins' | 'roe' | 'debt'>('revenue');

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

    const { data: promoterHistory } = useQuery({
        queryKey: ['cie-promoter-history', company?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_promoter_history')
                .select('*')
                .eq('company_id', company?.id)
                .order('date', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!company?.id
    });

    const { data: sectorPeers } = useQuery({
        queryKey: ['cie-sector-peers', company?.sector],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('*, cie_fundamentals(*), cie_macro_signals(*)')
                .eq('sector', company?.sector);
            if (error) throw error;
            return data;
        },
        enabled: !!company?.sector
    });
    const { data: recentDeals } = useQuery({
        queryKey: ['cie-company-deals', company?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_bulk_block_deals')
                .select('*')
                .eq('company_id', company?.id)
                .order('date', { ascending: false })
                .limit(10);
            if (error) throw error;
            return data;
        },
        enabled: !!company?.id
    });

    const { data: shortHistory } = useQuery({
        queryKey: ['cie-short-history', company?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_short_selling_history')
                .select('*')
                .eq('company_id', company?.id)
                .order('date', { ascending: true })
                .limit(90);
            if (error) throw error;
            return data;
        },
        enabled: !!company?.id
    });


    const peerComparison = useMemo(() => {
        if (!sectorPeers || !company) return null;
        const myScore = company.cie_macro_signals?.[0]?.macro_impact_score || 50;

        const latestFundamentals = sectorPeers.map(p => {
            const funds = [...(p.cie_fundamentals || [])].sort((a, b) => new Date(b.quarter_date).getTime() - new Date(a.quarter_date).getTime());
            return {
                company: p,
                fund: funds[0],
                macroScore: p.cie_macro_signals?.[0]?.macro_impact_score || 50,
                pledge: p.promoter_pledge_pct || 0
            };
        }).filter(p => p.fund);

        const avgMargin = latestFundamentals.reduce((acc, p) => acc + (p.fund.operating_margin || 0), 0) / (latestFundamentals.length || 1);
        const avgROE = latestFundamentals.reduce((acc, p) => acc + (p.fund.return_on_equity || 0), 0) / (latestFundamentals.length || 1);
        const avgSectorPledge = latestFundamentals.reduce((acc, p) => acc + p.pledge, 0) / (latestFundamentals.length || 1);

        const macroPeers = latestFundamentals.filter(p => Math.abs(p.macroScore - myScore) <= 15);
        const safeMacroLength = macroPeers.length || 1;
        const macroAvgMargin = macroPeers.reduce((acc, p) => acc + (p.fund.operating_margin || 0), 0) / safeMacroLength;
        const macroAvgROE = macroPeers.reduce((acc, p) => acc + (p.fund.return_on_equity || 0), 0) / safeMacroLength;

        return {
            avgMargin: avgMargin * 100,
            avgROE: avgROE * 100,
            avgSectorPledge,
            macroAvgMargin: macroAvgMargin * 100,
            macroAvgROE: macroAvgROE * 100,
            macroPeerCount: macroPeers.length
        };
    }, [sectorPeers, company]);

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
                <h1 className="text-2xl font-black text-white mb-2">Company Not Found</h1>
                <Link to="/india-equities" className="text-blue-400 hover:text-blue-300 transition-colors">
                    &larr; Back to Screener
                </Link>
            </div>
        );
    }

    const latestSignal = company?.cie_macro_signals?.[0] || {};
    const radarData = [
        { subject: 'State Resilience', A: latestSignal.state_resilience || 0, fullMark: 100 },
        { subject: 'Capex Efficiency', A: latestSignal.capex_efficiency || 50, fullMark: 100 },
        { subject: 'Formalization', A: latestSignal.formalization_premium || 0, fullMark: 100 },
        { subject: 'Oil Resilience', A: 100 - (latestSignal.oil_sensitivity || 0), fullMark: 100 },
        { subject: 'Liquidity Resilience', A: 100 - (latestSignal.liquidity_transmission_lag || 0), fullMark: 100 },
        { subject: 'Macro Score', A: latestSignal.macro_impact_score || 0, fullMark: 100 },
    ];

    const sortedFunds = [...(company.cie_fundamentals || [])].sort((a, b) =>
        new Date(a.quarter_date).getTime() - new Date(b.quarter_date).getTime()
    );

    const latestFund = sortedFunds[sortedFunds.length - 1] || {};
    const mcap = latestFund.metadata?.last_price ? (latestFund.revenue * latestFund.metadata.last_price / 1000) / 10000000 : 0;

    const chartData = sortedFunds.map(f => ({
        date: new Date(f.quarter_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: f.revenue ? Number((f.revenue / 10000000).toFixed(0)) : 0,
        profit: f.net_profit ? Number((f.net_profit / 10000000).toFixed(0)) : 0,
        margins: f.operating_margin ? Number((f.operating_margin * 100).toFixed(1)) : 0,
        roe: f.return_on_equity ? Number((f.return_on_equity * 100).toFixed(1)) : 0,
        debt: f.debt_equity_ratio ? Number(f.debt_equity_ratio.toFixed(2)) : 0,
    }));

    const pledgeTrendData = (promoterHistory || []).map(h => ({
        date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        pledge: Number(h.pledge_pct?.toFixed(2) || 0),
        insider: Number(h.insider_net_buying?.toFixed(1) || 0)
    }));

    const shortTrendData = (shortHistory || []).map(h => ({
        date: new Date(h.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        shortQty: Number(h.short_quantity || 0),
        ratio: Number(h.pct_of_delivery || 0)
    }));

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header Section */}
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
                        <div className="flex flex-wrap gap-6 text-right items-end">
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Market Cap</p>
                                <p className="text-2xl font-black">₹{mcap.toFixed(0)} <span className="text-sm text-white/40">Cr</span></p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Current Price</p>
                                <p className="text-2xl font-black text-blue-400">₹{latestFund.metadata?.last_price?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-widest font-black text-white/30 mb-1">Short Interest</p>
                                <p className={`text-2xl font-black ${(company.short_interest_pct || 0) > 20 ? 'text-rose-400' : 'text-white/40'}`}>
                                    {(company.short_interest_pct || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fundamental Trends */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center">
                                    <Activity size={16} className="mr-2 text-blue-400" /> Fundamental Trend
                                </h3>
                                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                    {['revenue', 'profit', 'margins', 'roe', 'debt'].map(metric => (
                                        <button
                                            key={metric}
                                            onClick={() => setChartMetric(metric as any)}
                                            className={`px-3 py-1.5 rounded-lg text-[0.65rem] font-bold uppercase tracking-wider transition-all ${chartMetric === metric ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                        >
                                            {metric}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-72 w-full">
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
                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey={chartMetric} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Promoter & Governance Activity Section */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center">
                                    <Users size={16} className="mr-2 text-purple-400" /> Promoter Activity & Pledging Trend
                                </h3>
                                <div className="flex gap-4 text-[0.65rem] font-black uppercase tracking-widest text-white/30">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Pledging (%)</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Insider (Cr)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-[0.6rem] uppercase tracking-widest font-black text-white/30 mb-1">Current Pledge</p>
                                    <p className={`text-xl font-black ${(company.promoter_pledge_pct || 0) > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {company.promoter_pledge_pct || 0}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-[0.6rem] uppercase tracking-widest font-black text-white/30 mb-1">Pledge 1Y Delta</p>
                                    <p className={`text-xl font-black ${(company.pledge_delta || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {company.pledge_delta > 0 ? '+' : ''}{(company.pledge_delta || 0).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-[0.6rem] uppercase tracking-widest font-black text-white/30 mb-1">Insider Buy (12M)</p>
                                    <p className={`text-xl font-black ${(company.insider_buy_sell_net || 0) > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {company.insider_buy_sell_net > 0 ? `+${company.insider_buy_sell_net}` : company.insider_buy_sell_net || 0} Cr
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <p className="text-[0.6rem] uppercase tracking-widest font-black text-white/30 mb-1">Sector Avg Pledge</p>
                                    <p className="text-xl font-black text-blue-400">{peerComparison?.avgSectorPledge.toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={pledgeTrendData}>
                                        <XAxis dataKey="date" stroke="#ffffff10" fontSize={10} />
                                        <YAxis yAxisId="left" stroke="#3b82f620" fontSize={10} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#a855f720" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff10' }} />
                                        <Line yAxisId="left" type="monotone" dataKey="pledge" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                                        <Line yAxisId="right" type="monotone" dataKey="insider" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Bulk & Block Deals Section (Phase 11) */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <Briefcase size={16} className="mr-2 text-blue-400" /> Bulk & Block Deals (Last 30 Days)
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20">Date</th>
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20">Client</th>
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20">Type</th>
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20 text-right">Qty</th>
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20 text-right">Price</th>
                                            <th className="pb-4 text-[0.6rem] font-black uppercase tracking-widest text-white/20 text-right">% Eq</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {recentDeals && recentDeals.length > 0 ? (
                                            recentDeals.map((deal: any) => (
                                                <tr key={deal.id}>
                                                    <td className="py-4">
                                                        <span className="text-[0.7rem] font-medium text-white/60">{format(new Date(deal.date), 'dd MMM')}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-[0.7rem] font-medium text-white/80">{deal.client_name}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`text-[0.6rem] font-black px-1.5 py-0.5 rounded ${deal.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                            {deal.type} {deal.deal_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="text-[0.7rem] font-mono text-white/60">{(deal.quantity / 100000).toFixed(1)}L</span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="text-[0.7rem] font-mono text-white/60">₹{deal.price}</span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className={`text-[0.7rem] font-black ${deal.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {deal.equity_pct}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center">
                                                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/10 italic">No significant deals reported in the last 30 days.</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Benchmark & Radar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                    <Activity size={16} className="mr-2 text-rose-400" /> Short Selling Trend
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={shortTrendData}>
                                            <defs>
                                                <linearGradient id="colorShort" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" stroke="#ffffff10" fontSize={9} interval={Math.floor(shortTrendData.length / 5)} />
                                            <YAxis stroke="#ffffff10" fontSize={10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff10' }} />
                                            <Area type="monotone" dataKey="shortQty" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorShort)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                    <Activity size={16} className="mr-2 text-orange-400" /> Macro Risk Radar
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#ffffff10" />
                                            <PolarAngleAxis dataKey="subject" stroke="#ffffff40" fontSize={10} />
                                            <Radar name={company.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Governance Snapshot */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6 flex items-center">
                                <ShieldAlert size={16} className="mr-2 text-rose-400" /> Governance Snapshot
                            </h3>
                            <div className="space-y-5">
                                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[0.6rem] uppercase tracking-widest font-black text-rose-400/60 mb-1">Gov Risk Score</p>
                                            <p className="text-2xl font-black text-white">{company.governance_risk_score || 0}<span className="text-xs text-white/30">/100</span></p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[0.6rem] font-black uppercase tracking-widest ${(company.governance_risk_score || 0) < 30 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {(company.governance_risk_score || 0) < 30 ? 'Low Risk' : 'High Risk'}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${company.governance_risk_score || 0}%` }} />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                    <p className="text-[0.6rem] uppercase tracking-widest font-black text-blue-400/60 mb-2">Last Regulatory Action</p>
                                    <p className="text-xs font-bold text-white/80 leading-relaxed italic">
                                        "{company.last_sebi_action || 'No SEBI/ED observations reported in the last 24 months.'}"
                                    </p>
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
