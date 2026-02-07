import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from '@/components/Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { usePreciousDivergence } from '@/hooks/usePreciousDivergence';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PreciousDivergenceCard: React.FC = () => {
    const { data, isLoading } = usePreciousDivergence();

    const getMetric = (id: string) => data?.find(m => m.metric_id === id);

    const goldDist = getMetric('GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverDist = getMetric('SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const renderMetric = (metric: any, label: string) => {
        const isPositive = (metric?.value || 0) > 0;
        const colorClass = isPositive ? 'text-emerald-500' : 'text-rose-500';
        const bgClass = isPositive ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/15 text-rose-500 border-rose-500/30';
        const colorHex = isPositive ? '#10b981' : '#f43f5e';

        return (
            <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[0.65rem] font-extrabold text-muted-foreground tracking-[0.05em] uppercase">
                        {label} PREMIUM
                    </span>
                    {metric && (
                        <span className={cn(
                            "text-[0.5rem] font-black px-1.5 py-0.5 rounded-[2px] border leading-none min-w-[40px] text-center",
                            bgClass
                        )}>
                            {isPositive ? 'PREMIUM' : 'DISCOUNT'}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                    {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                    ) : (
                        <h4 className={cn("text-3xl font-black tracking-tighter", colorClass)}>
                            {metric?.value !== undefined && metric?.value !== null ? (metric.value > 0 ? '+' : '') + metric.value.toFixed(2) + '%' : 'N/A'}
                        </h4>
                    )}
                </div>

                <div className="h-10 opacity-60">
                    {!isLoading && metric?.history && (
                        <Sparkline data={metric.history} height={40} color={colorHex} />
                    )}
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
                className="p-5 h-[250px] cursor-pointer flex flex-col relative transition-all duration-300 border-border bg-card/40 backdrop-blur-md hover:border-primary hover:shadow-xl hover:-translate-y-0.5 group"
                onClick={() => {
                    // gtag is global, assume it exists or needs window prefix. Keeping as is for now but strict TS might complain.
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                        (window as any).gtag('event', 'click_divergence_card', {
                            gold_spread: goldDist?.value,
                            silver_spread: silverDist?.value
                        });
                    }
                }}
            >
                <div className="flex justify-between mb-4">
                    <div>
                        <span className="block text-[0.65rem] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                            Physical vs Paper
                        </span>
                        <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                            Shanghai Divergence
                        </h3>
                    </div>
                    <Info size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-6 mt-2">
                    {renderMetric(goldDist, 'GOLD')}
                    {renderMetric(silverDist, 'SILVER')}
                </div>

                <div className="mt-auto">
                    <span className="block text-[0.6rem] font-bold text-muted-foreground/60 leading-tight">
                        Positive = Shanghai Premium (China physical squeeze)
                    </span>
                </div>
            </Card>
        </HoverDetail>
    );
};
