import React, { useMemo } from 'react';
import { Landmark, TrendingUp } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from 'recharts';
import { useChinaPolicyBanks, useChinaFiscalSignals } from '@/hooks/useChinaDebt';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';

export const ChinaPolicyBankMonitor: React.FC = () => {
    const { data: banks, isLoading } = useChinaPolicyBanks();
    const { data: signals } = useChinaFiscalSignals(['policy_bank_bonds_total']);

    const latestYear = '2024';
    const latestBanks = useMemo(() =>
        banks?.filter(b => b.as_of_date.startsWith(latestYear)) ?? [],
    [banks]);

    const aggregateHistory = useMemo(() =>
        signals?.filter(s => s.signal_key === 'policy_bank_bonds_total').map(s => ({
            year: s.as_of_date.slice(0, 4),
            total: s.value,
            low: s.value_low,
            high: s.value_high,
        })) ?? [],
    [signals]);

    const institutionHistory = useMemo(() => {
        const years = [...new Set(banks?.map(b => b.as_of_date.slice(0, 4)) ?? [])].sort();
        return years.map(year => {
            const row: Record<string, string | number> = { year };
            ['CDB', 'EXIM', 'ADBC'].forEach(code => {
                const b = banks?.find(x => x.institution_code === code && x.as_of_date.startsWith(year));
                row[code] = b?.bonds_outstanding_cny_tn ?? 0;
            });
            return row;
        });
    }, [banks]);

    const totalOutstanding = latestBanks.reduce((s, b) => s + (b.bonds_outstanding_cny_tn ?? 0), 0);
    const avgSpread = latestBanks.length
        ? latestBanks.reduce((s, b) => s + (b.spread_vs_cgb_bps ?? 0), 0) / latestBanks.length
        : null;

    if (isLoading) {
        return <div className="h-[400px] rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <Landmark size={20} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                        Policy Bank Debt Monitor
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        CDB + EXIM + ADBC — the hidden sovereign balance sheet
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">Aggregate Bonds</p>
                    <p className="text-2xl font-black text-white font-mono">{totalOutstanding.toFixed(1)}<span className="text-xs text-muted-foreground/50 ml-1">CNY Tn</span></p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">Avg Spread vs CGB</p>
                    <p className="text-2xl font-black text-white font-mono">{avgSpread?.toFixed(0) ?? '—'}<span className="text-xs text-muted-foreground/50 ml-1">bps</span></p>
                </div>
                {latestBanks.map(b => (
                    <div key={b.institution_code} className="p-5 rounded-2xl bg-purple-500/[0.04] border border-purple-500/10">
                        <p className="text-xs font-black uppercase tracking-uppercase text-purple-400/80 mb-2">{b.institution_code}</p>
                        <p className="text-xl font-black text-white font-mono">{b.bonds_outstanding_cny_tn?.toFixed(1)} Tn</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">{b.pct_total_bond_market?.toFixed(1)}% of bond market</p>
                    </div>
                )).slice(0, 2)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        Bonds Outstanding by Institution
                    </h4>
                    {institutionHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={institutionHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit=" Tn" />
                                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="CDB" stackId="a" fill="#a855f7" name="CDB" />
                                <Bar dataKey="EXIM" stackId="a" fill="#6366f1" name="EXIM" />
                                <Bar dataKey="ADBC" stackId="a" fill="#8b5cf6" name="ADBC" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground/50">No institution history</p>
                    )}
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        Aggregate Growth vs GDP
                    </h4>
                    {aggregateHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={aggregateHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                                <Line type="monotone" dataKey="total" stroke="#c084fc" strokeWidth={2} dot={{ fill: '#c084fc', r: 3 }} name="Total CNY Tn" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground/50">No aggregate history</p>
                    )}
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-purple-500/[0.03] border border-purple-500/10 text-sm text-muted-foreground/70 leading-relaxed flex items-start gap-2">
                <TrendingUp size={16} className="text-purple-400 shrink-0 mt-0.5" />
                <span>
                    Policy bank balance sheets expanded ~3× faster than GDP (2010–2020). Spread widening above 25bps vs CGB
                    would signal systemic quasi-fiscal stress. PSL channel via CDB remains the primary off-budget infrastructure financier.
                </span>
            </div>

            <DataProvenanceBadge source="CDB/EXIM/ADBC Annual Reports + BIS" size="sm" />
        </div>
    );
};