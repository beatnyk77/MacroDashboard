import React from 'react';
import { Box, Button, Skeleton } from '@mui/material';
import { BarChart3, ExternalLink, Info } from 'lucide-react';
import { usePredictionMarkets } from '@/hooks/usePredictionMarkets';
import { cn } from '@/lib/utils';

export const PredictionMarketTerminal: React.FC = () => {
    const { data: markets, isLoading } = usePredictionMarkets();

    if (isLoading) {
        return (
            <Box className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={60} className="rounded-xl bg-white/5" />
                ))}
            </Box>
        );
    }

    const topMarkets = markets?.slice(0, 15) || [];

    return (
        <Box className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-blue-500" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Prediction Market Terminal</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[0.6rem] font-bold uppercase tracking-tighter text-emerald-500/80">Live Feed</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Market Question</th>
                            <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Platform</th>
                            <th className="px-4 py-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground text-center">Probability</th>
                            <th className="px-4 py-4 text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground text-center">Volume</th>
                            <th className="px-6 py-4 text-right text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {topMarkets.map((m) => (
                            <tr key={m.id} className="group hover:bg-white/[0.03] transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                                            {m.question}
                                        </span>
                                        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground/60 mt-1 font-bold">
                                            {m.category}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-[0.6rem] font-black uppercase tracking-tighter",
                                        m.platform === 'kalshi' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                            m.platform === 'polymarket' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                                "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                    )}>
                                        {m.platform}
                                    </span>
                                </td>
                                <td className="px-4 py-5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-lg font-black text-white tabular-nums">
                                            {(m.probability * 100).toFixed(1)}%
                                        </span>
                                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-1000"
                                                style={{ width: `${m.probability * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-center">
                                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                        ${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(m.volume)}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <Button
                                        variant="contained"
                                        size="small"
                                        href={m.affiliate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        endIcon={<ExternalLink size={12} />}
                                        sx={{
                                            bgcolor: 'white',
                                            color: 'black',
                                            fontWeight: 900,
                                            fontSize: '0.65rem',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: '8px',
                                            '&:hover': { bgcolor: '#e2e2e2' }
                                        }}
                                    >
                                        Trade Now
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-white/10 bg-white/5 px-6 py-3 flex justify-between items-center text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Aggregation powered by DomeAPI</span>
                <div className="flex items-center gap-2">
                    <Info size={12} className="text-blue-400" />
                    <span>Affiliate links active</span>
                </div>
            </div>
        </Box>
    );
};
