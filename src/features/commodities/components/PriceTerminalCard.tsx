import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommodityPrices } from '@/hooks/useCommodityPrices';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataStatePanel } from '@/components/DataStatePanel';
import { getStaleness } from '@/hooks/useStaleness';

const EXPECTED_SYMBOLS = ['WTI Crude', 'Brent Crude', 'Copper ($/t)', 'Nickel ($/t)'] as const;

export const PriceTerminalCard: React.FC = () => {
    const { data: prices, isLoading, isError, refetch } = useCommodityPrices();

    const latestPrices = React.useMemo(() => {
        if (!prices) return [];
        const uniqueSymbols = Array.from(new Set(prices.map(p => p.symbol)));
        return uniqueSymbols.map(sym => {
            const symPrices = prices.filter(p => p.symbol === sym).sort((a, b) => new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime());
            return {
                symbol: sym,
                latest: symPrices[0],
                previous: symPrices[1],
            };
        });
    }, [prices]);

    const priceBySymbol = React.useMemo(
        () => new Map(latestPrices.map(entry => [entry.symbol, entry])),
        [latestPrices],
    );

    const headerFreshness = React.useMemo(() => {
        if (!latestPrices.length) return null;
        const oldestMs = latestPrices.reduce((acc, entry) => {
            const t = new Date(entry.latest.as_of_date).getTime();
            return t < acc ? t : acc;
        }, Infinity);
        const oldestDate = new Date(oldestMs).toISOString();
        return { ...getStaleness(oldestDate, 'daily'), lastUpdated: oldestDate };
    }, [latestPrices]);

    if (isLoading) {
        return (
            <DataStatePanel
                variant="pending"
                title="Loading commodity prices"
                height={192}
            />
        );
    }

    if (isError) {
        return (
            <DataStatePanel
                variant="error"
                title="Commodity prices unavailable"
                description="Unable to load FRED commodity price telemetry."
                onRetry={() => refetch()}
                height={192}
            />
        );
    }

    if (!prices || prices.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="No commodity price data"
                description="WTI, Brent, and metals price observations are pending ingestion."
                height={192}
            />
        );
    }

    return (
        <Card className="bg-black/40 border-white/12 backdrop-blur-md">
            <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-4 lg:px-6">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">
                        Commodity Price Terminal
                    </CardTitle>
                    {headerFreshness && (
                        <FreshnessChip status={headerFreshness.state} lastUpdated={headerFreshness.lastUpdated} />
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wide mt-1">
                    FRED daily · Updated via ingest-fred
                </p>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {EXPECTED_SYMBOLS.map(symbol => {
                        const entry = priceBySymbol.get(symbol);
                        if (!entry) {
                            return (
                                <div key={symbol} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <span className="text-xs font-bold text-muted-foreground">{symbol}</span>
                                    <span className="text-sm font-black text-muted-foreground/30 uppercase tracking-wide">Unavailable</span>
                                </div>
                            );
                        }

                        const { latest, previous } = entry;
                        const change = previous ? ((latest.price - previous.price) / previous.price) * 100 : 0;
                        const zScore = latest.z_score || 0;
                        const symbolFreshness = {
                            ...getStaleness(latest.as_of_date, 'daily'),
                            lastUpdated: latest.as_of_date,
                        };

                        return (
                            <div key={symbol} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs font-bold text-muted-foreground">{symbol}</span>
                                    {change > 0 ? (
                                        <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                                    ) : change < 0 ? (
                                        <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                                    ) : (
                                        <Minus className="w-3 h-3 text-muted-foreground shrink-0" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black tracking-heading">
                                        ${latest.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn(
                                            'text-xs font-bold',
                                            change >= 0 ? 'text-emerald-500' : 'text-rose-500',
                                        )}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground/40">
                                            Z: {zScore.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        <FreshnessChip
                                            status={symbolFreshness.state}
                                            lastUpdated={symbolFreshness.lastUpdated}
                                        />
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