import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommodityPrices } from '@/hooks/useCommodityPrices';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PriceTerminalCard: React.FC = () => {
    const { data: prices, isLoading } = useCommodityPrices();

    // Grouping latest prices by symbol
    const latestPrices = React.useMemo(() => {
        if (!prices) return [];
        const uniqueSymbols = Array.from(new Set(prices.map(p => p.symbol)));
        return uniqueSymbols.map(sym => {
            const symPrices = prices.filter(p => p.symbol === sym).sort((a, b) => new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime());
            return {
                symbol: sym,
                latest: symPrices[0],
                previous: symPrices[1]
            };
        });
    }, [prices]);

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-4 lg:px-6">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Price Terminal & Forward Signals
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {latestPrices.map(({ symbol, latest, previous }) => {
                        const change = previous ? ((latest.price - previous.price) / previous.price) * 100 : 0;
                        const zScore = latest.z_score || 0;

                        return (
                            <div key={symbol} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-muted-foreground">{symbol}</span>
                                    {change > 0 ? (
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                    ) : change < 0 ? (
                                        <TrendingDown className="w-3 h-3 text-rose-500" />
                                    ) : (
                                        <Minus className="w-3 h-3 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black tracking-tighter">
                                        ${latest.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            change >= 0 ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                        </span>
                                        <span className="text-[10px] font-medium text-muted-foreground/40">
                                            Z: {zScore.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
