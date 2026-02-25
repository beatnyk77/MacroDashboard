import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TICHolder {
    country_name: string;
    as_of_date: string;
    holdings_usd_bn: number;
}

export const TopTreasuryHoldersTable: React.FC = () => {
    const { data: rawData, isLoading } = useQuery({
        queryKey: ['tic-foreign-holders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tic_foreign_holders')
                .select('*')
                .order('as_of_date', { ascending: false });
            if (error) throw error;
            return data as TICHolder[];
        }
    });

    const processedData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        // Get latest date
        const latestDate = rawData[0].as_of_date;
        const latest = rawData.filter(d => d.as_of_date === latestDate);

        // Get previous year data for YoY calculation
        const prevYearDate = new Date(latestDate);
        prevYearDate.setFullYear(prevYearDate.getFullYear() - 1);

        const previous = rawData.filter(d => {
            const diffMonths = Math.abs(
                (new Date(d.as_of_date).getTime() - prevYearDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
            );
            return diffMonths < 2; // Within 2 months of previous year
        });

        // Calculate total for share percentage
        const total = latest.reduce((sum, h) => sum + h.holdings_usd_bn, 0);

        // Merge and calculate YoY
        return latest
            .map(current => {
                const prev = previous.find(p => p.country_name === current.country_name);
                const yoyChange = prev
                    ? ((current.holdings_usd_bn - prev.holdings_usd_bn) / prev.holdings_usd_bn) * 100
                    : 0;

                return {
                    country: current.country_name,
                    holdings: current.holdings_usd_bn,
                    yoyChange,
                    shareOfTotal: (current.holdings_usd_bn / total) * 100,
                    asOfDate: current.as_of_date
                };
            })
            .sort((a, b) => b.holdings - a.holdings)
            .slice(0, 10);
    }, [rawData]);

    const latestDate = processedData[0]?.asOfDate;

    if (isLoading) {
        return (
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl h-[600px] animate-pulse">
                <CardHeader className="pb-4">
                    <div className="h-6 w-64 bg-white/10 rounded" />
                </CardHeader>
            </Card>
        );
    }

    if (!processedData || processedData.length === 0) {
        return (
            <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl">
                <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                            <h3 className="text-lg font-black text-muted-foreground uppercase tracking-widest italic">
                                Top Foreign <span className="text-white">Holders</span> of US Treasuries
                            </h3>
                            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tight mt-1">
                                Major sovereign and institutional positions (TIC data)
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-12 text-center">
                    <p className="text-sm text-muted-foreground">No TIC data available. Run ingestion function.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01] p-6">
                <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                        <h3 className="text-lg font-black text-muted-foreground uppercase tracking-widest italic">
                            Top Foreign <span className="text-white">Holders</span> of US Treasuries
                        </h3>
                        <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tight mt-1">
                            Major sovereign and institutional positions (TIC data)
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="text-left p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rank</th>
                                <th className="text-left p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Country/Region</th>
                                <th className="text-right p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Holdings ($B)</th>
                                <th className="text-right p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">YoY Change</th>
                                <th className="text-right p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Share of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((holder, index) => (
                                <tr
                                    key={holder.country}
                                    className={cn(
                                        "border-b border-white/5 transition-all hover:bg-white/[0.03]",
                                        index % 2 === 0 ? "bg-white/[0.01]" : "bg-white/[0.02]"
                                    )}
                                >
                                    <td className="p-4">
                                        <span className="text-sm font-black text-white/40 tabular-nums">#{index + 1}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-bold text-white">{holder.country}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-lg font-black text-white tabular-nums">
                                            ${holder.holdings.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={cn(
                                            "flex items-center justify-end gap-1 text-sm font-bold tabular-nums",
                                            holder.yoyChange >= 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {holder.yoyChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {Math.abs(holder.yoyChange).toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500/60 rounded-full"
                                                    style={{ width: `${Math.min(holder.shareOfTotal, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground tabular-nums w-12">
                                                {holder.shareOfTotal.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-4">
                    {processedData.map((holder, index) => (
                        <div
                            key={holder.country}
                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        #{index + 1}
                                    </span>
                                    <h4 className="text-sm font-bold text-white mt-1">{holder.country}</h4>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-bold",
                                    holder.yoyChange >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {holder.yoyChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs(holder.yoyChange).toFixed(1)}%
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Holdings</span>
                                    <span className="text-lg font-black text-white tabular-nums">${holder.holdings.toFixed(1)}B</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Share</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500/60 rounded-full"
                                                style={{ width: `${Math.min(holder.shareOfTotal, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                            {holder.shareOfTotal.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                    <p className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-tight">
                        Last updated: {latestDate ? new Date(latestDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'} • Source: Department of the Treasury/TIC
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
