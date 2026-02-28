import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { usePredictionMarkets } from '@/hooks/usePredictionMarkets';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Monetary Policy', 'Inflation', 'Geopolitics', 'Elections', 'Economics'];
const PLATFORMS = ['kalshi', 'polymarket', 'predictit'];

export const PredictionMarketHeatmap: React.FC = () => {
    const { data: markets, isLoading } = usePredictionMarkets();

    if (isLoading) return null;

    // Aggregate volume by category and platform
    const heatmapData = CATEGORIES.map(cat => {
        return PLATFORMS.map(plat => {
            const volume = markets
                ?.filter(m => m.category === cat && m.platform === plat)
                .reduce((sum, m) => sum + m.volume, 0) || 0;
            return { cat, plat, volume };
        });
    }).flat();

    const maxVolume = Math.max(...heatmapData.map(d => d.volume), 1);

    return (
        <Box className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] overflow-hidden">
            <div className="flex flex-col mb-8">
                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Market Liquidity Heatmap</h3>
                <p className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Volume intensity by category and platform
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {/* Header Spacer */}
                <div />
                {PLATFORMS.map(p => (
                    <div key={p} className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest text-center">
                        {p}
                    </div>
                ))}

                {CATEGORIES.map(cat => (
                    <React.Fragment key={cat}>
                        <div className="text-[0.65rem] font-bold text-white uppercase tracking-tight flex items-center">
                            {cat}
                        </div>
                        {PLATFORMS.map(plat => {
                            const data = heatmapData.find(d => d.cat === cat && d.plat === plat);
                            const intensity = data ? (data.volume / maxVolume) : 0;

                            return (
                                <Tooltip
                                    key={`${cat}-${plat}`}
                                    title={`${cat} on ${plat}: $${new Intl.NumberFormat().format(data?.volume || 0)}`}
                                    arrow
                                >
                                    <div
                                        className={cn(
                                            "h-12 rounded-lg border border-white/5 transition-all cursor-pointer transform hover:scale-105",
                                            intensity > 0.8 ? "bg-blue-500" :
                                                intensity > 0.5 ? "bg-blue-500/60" :
                                                    intensity > 0.2 ? "bg-blue-500/30" :
                                                        intensity > 0 ? "bg-blue-500/10" : "bg-white/[0.02]"
                                        )}
                                    />
                                </Tooltip>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest">Low Liquidity</span>
                    <div className="flex gap-1">
                        {[0.1, 0.3, 0.6, 1].map(i => (
                            <div
                                key={i}
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: `rgba(59, 130, 246, ${i})` }}
                            />
                        ))}
                    </div>
                    <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest">High Liquidity</span>
                </div>
                <div className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                    Last Updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </Box>
    );
};
