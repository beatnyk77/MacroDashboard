import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverDetail } from '@/components/HoverDetail';
import { usePreciousDivergence } from '@/hooks/usePreciousDivergence';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PreciousDivergenceCard: React.FC = () => {
    const { data, isLoading } = usePreciousDivergence();

    const getMetric = (id: string) => data?.find(m => m.metric_id === id);

    const goldDist = getMetric('GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverDist = getMetric('SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const renderPriceRow = (label: string, marketA: string, priceA: any, marketB: string, priceB: any, spread: any) => {
        const isPositive = (spread?.value || 0) > 0;
        const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';

        return (
            <div className="flex flex-col gap-3 py-4 border-b border-white/5 last:border-0">
                <div className="flex justify-between items-center text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">
                    <span>{label} CROSS-MARKET ARBITRAGE</span>
                    <span className={cn("px-2 py-0.5 rounded-sm border", isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400')}>
                        {isPositive ? 'SHANGHAI PREMIUM' : 'COMEX PREMIUM'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Market A (COMEX) */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                        <span className="block text-[0.55rem] font-bold text-muted-foreground/60 mb-1 uppercase tracking-tighter">{marketA} (WEST)</span>
                        <div className="text-xl font-black tracking-tight text-foreground">
                            {priceA?.value ? `$${priceA.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </div>
                    </div>
                    {/* Market B (SHANGHAI) */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                        <span className="block text-[0.55rem] font-bold text-muted-foreground/60 mb-1 uppercase tracking-tighter">{marketB} (EAST)</span>
                        <div className="text-xl font-black tracking-tight text-foreground">
                            {priceB?.value ? `$${priceB.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[0.65rem] font-bold text-muted-foreground uppercase">Divergence:</span>
                    <span className={cn("text-sm font-black tracking-widest", colorClass)}>
                        {spread?.value !== undefined ? (spread.value > 0 ? '+' : '') + spread.value.toFixed(2) + '%' : '—'}
                    </span>
                    <div className="flex-1 h-[2px] bg-white/5 rounded-full relative overflow-hidden">
                        <div
                            className={cn("absolute inset-y-0 left-1/2 w-1/2 transition-all duration-1000", isPositive ? 'bg-emerald-500' : 'bg-rose-500 left-0')}
                            style={{ width: `${Math.min(Math.abs(spread?.value || 0) * 10, 50)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const description = "Tracks the price divergence between COMEX (Western institutional paper market) and Shanghai (Eastern physical-dominant market).";
    const methodology = "Gold Spread = (Shanghai Gold USD - COMEX Gold USD) / COMEX Gold USD. Silver Spread = (Shanghai Silver USD - COMEX Silver USD) / COMEX Silver USD. Shanghai prices are converted from CNY/oz using live USDCNY rates.";

    return (
        <HoverDetail
            title="Precious Metals Divergence"
            subtitle="Shanghai vs COMEX Arbitrage"
            detailContent={{
                description,
                methodology,
                source: "Yahoo Finance, COMEX, SGE",
                stats: [
                    { label: 'Gold Shanghai (USD)', value: (getMetric('GOLD_SHANGHAI_USD')?.value !== undefined && getMetric('GOLD_SHANGHAI_USD')?.value !== null) ? getMetric('GOLD_SHANGHAI_USD')!.value.toFixed(2) : 'N/A' },
                    { label: 'Gold COMEX (USD)', value: (getMetric('GOLD_COMEX_USD')?.value !== undefined && getMetric('GOLD_COMEX_USD')?.value !== null) ? getMetric('GOLD_COMEX_USD')!.value.toFixed(2) : 'N/A' },
                    { label: 'Silver Shanghai (USD)', value: (getMetric('SILVER_SHANGHAI_USD')?.value !== undefined && getMetric('SILVER_SHANGHAI_USD')?.value !== null) ? getMetric('SILVER_SHANGHAI_USD')!.value.toFixed(2) : 'N/A' },
                    { label: 'Silver COMEX (USD)', value: (getMetric('SILVER_COMEX_USD')?.value !== undefined && getMetric('SILVER_COMEX_USD')?.value !== null) ? getMetric('SILVER_COMEX_USD')!.value.toFixed(2) : 'N/A' },
                ]
            }}
        >
            <Card
                className="p-6 h-full cursor-pointer flex flex-col relative transition-all duration-300 border-border bg-card/40 backdrop-blur-md hover:border-primary hover:shadow-xl hover:-translate-y-0.5 group"
                onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                        (window as any).gtag('event', 'click_divergence_card', {
                            gold_spread: goldDist?.value,
                            silver_spread: silverDist?.value
                        });
                    }
                }}
            >
                <div className="flex justify-between mb-6">
                    <div>
                        <span className="block text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">
                            Physical vs Paper Settlement
                        </span>
                        <h3 className="text-lg font-black text-foreground tracking-tight">
                            Shanghai Divergence
                        </h3>
                    </div>
                    <Info size={16} className="text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {renderPriceRow('Gold', 'COMEX', getMetric('GOLD_COMEX_USD'), 'Shanghai', getMetric('GOLD_SHANGHAI_USD'), goldDist)}
                        {renderPriceRow('Silver', 'COMEX', getMetric('SILVER_COMEX_USD'), 'Shanghai', getMetric('SILVER_SHANGHAI_USD'), silverDist)}
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 italic">
                    <span className="block text-[0.65rem] font-bold text-muted-foreground/60 leading-tight">
                        Note: Positive divergence signals a Shanghai Premium (Eastern physical squeeze). Comex represents the paper-dominant Western settlement.
                    </span>
                </div>
            </Card>
        </HoverDetail>
    );
};
