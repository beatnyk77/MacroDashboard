import React, { useMemo } from 'react';
import { Globe2, AlertTriangle } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import { useChinaBRIExposure, useChinaFiscalSignals } from '@/hooks/useChinaDebt';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';

export const ChinaCrossBorderExposurePanel: React.FC = () => {
    const { data: exposure, isLoading } = useChinaBRIExposure();
    const { data: signals } = useChinaFiscalSignals(['bri_lending_total_usd_bn', 'bri_distressed_share_pct']);

    const latestSignals = useMemo(() => {
        const byKey: Record<string, { value: number; as_of_date: string }> = {};
        signals?.forEach(s => {
            const ex = byKey[s.signal_key];
            if (!ex || s.as_of_date > ex.as_of_date) byKey[s.signal_key] = { value: s.value, as_of_date: s.as_of_date };
        });
        return byKey;
    }, [signals]);

    const regions = exposure?.filter(e => !e.iso3) ?? [];
    const countries = exposure?.filter(e => e.iso3) ?? [];
    const distressed = countries.filter(c => c.distress_flag);

    const chartData = regions.map(r => ({
        name: r.country_or_region.replace('Sub-Saharan ', 'SS ').replace('Southeast ', 'SEA '),
        value: r.lending_outstanding_bn ?? 0,
    }));

    if (isLoading) {
        return <div className="h-[400px] rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <Globe2 size={20} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-uppercase italic">
                        Cross-Border Debt Exposure
                    </h3>
                    <p className="text-xs text-muted-foreground/60">
                        China as creditor — BRI defaults feed back into policy bank capital
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">Total BRI Lending</p>
                    <p className="text-2xl font-black text-white font-mono">
                        ${latestSignals.bri_lending_total_usd_bn?.value != null
                            ? `${(latestSignals.bri_lending_total_usd_bn.value).toFixed(0)}B`
                            : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">AidData estimate</p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-500/[0.04] border border-rose-500/15">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">Distressed Share</p>
                    <p className="text-2xl font-black text-rose-400 font-mono">
                        {latestSignals.bri_distressed_share_pct?.value?.toFixed(1) ?? '—'}%
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Portfolio in distress/restructuring</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-2">Distress Countries</p>
                    <p className="text-2xl font-black text-white font-mono">{distressed.length}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Active restructuring or default</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        Lending by Region (USD Bn)
                    </h4>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, left: 60, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                                <Tooltip contentStyle={{ background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={`rgba(59, 130, 246, ${0.4 + (i * 0.1)})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground/50">Regional data unavailable</p>
                    )}
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40 mb-4">
                        Countries in Distress / Restructuring
                    </h4>
                    <div className="space-y-3">
                        {distressed.map(c => (
                            <div key={c.country_or_region} className="flex items-start justify-between gap-4 p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/10">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={12} className="text-rose-400" />
                                        <span className="text-sm font-bold text-white">{c.country_or_region}</span>
                                        {c.iso3 && <span className="text-xs font-mono text-white/30">{c.iso3}</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground/50 mt-1">{c.sector}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-mono text-white">${c.lending_outstanding_bn?.toFixed(1)}B</p>
                                    <p className="text-xs text-rose-300/70">{c.restructuring_status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 text-sm text-muted-foreground/70 leading-relaxed">
                <span className="font-black uppercase text-xs text-blue-400 mr-2 tracking-uppercase">Contagion Scenario:</span>
                If 20% of BRI loans become NPL, estimated impact on policy bank capital adequacy is material but not
                system-threatening — unless combined with domestic LGFV rollover stress (see Debt Wall Proximity index).
            </div>

            <DataProvenanceBadge source="AidData + Boston University GDP Center" size="sm" />
        </div>
    );
};