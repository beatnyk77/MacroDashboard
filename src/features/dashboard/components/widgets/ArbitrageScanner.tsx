import { Box, Button } from '@mui/material';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { usePredictionMarkets } from '@/hooks/usePredictionMarkets';
import { cn } from '@/lib/utils';

// Mock structural signals for demo/initial implementation
// In a real scenario, these would come from useNetLiquidity, useGritIndex, etc.
const STRUCTURAL_SIGNALS = {
    'FOMC': 0.85, // 85% chance of cut based on internal models
    'Recession': 0.15, // 15% chance based on internal models
    'CPI': 0.40, // 40% chance of above target
};

export const ArbitrageScanner: React.FC = () => {
    const { data: markets, isLoading } = usePredictionMarkets();

    if (isLoading) return null;

    // Filter for markets that match our structural signals
    const divergences = markets?.map(m => {
        const signalKey = Object.keys(STRUCTURAL_SIGNALS).find(k => m.question.includes(k));
        if (!signalKey) return null;

        const internalProb = STRUCTURAL_SIGNALS[signalKey as keyof typeof STRUCTURAL_SIGNALS];
        const diff = m.probability - internalProb;

        return {
            ...m,
            internalProb,
            diff,
            absDiff: Math.abs(diff)
        };
    }).filter(Boolean).filter(d => d!.absDiff > 0.1) // 10% threshold for divergence
        .sort((a, b) => b!.absDiff - a!.absDiff) || [];

    if (divergences.length === 0) return null;

    return (
        <Box className="p-8 rounded-[32px] border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-rose-500" size={20} />
                        <h3 className="text-lg font-black uppercase tracking-tighter text-white">Divergence Alert</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground/80 mb-8 max-w-md">
                        Market pricing significantly deviates from GraphiQuestor structural signals. Significant alpha/hedging opportunity detected.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[0.6rem] font-black text-rose-400 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-xs font-bold text-white uppercase tabular-nums">High Confidence</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {divergences.slice(0, 4).map((d) => (
                    <div key={d!.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-3 group hover:border-rose-500/40 transition-all">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-white tracking-tight leading-tight flex-1 pr-4">
                                {d!.question}
                            </span>
                            <span className={cn(
                                "text-[0.6rem] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                d!.diff > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                            )}>
                                {d!.diff > 0 ? "Underpriced" : "Overpriced"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                            <div>
                                <div className="text-[0.55rem] font-black text-muted-foreground uppercase mb-1">Market Prob.</div>
                                <div className="text-sm font-black text-white">{(d!.probability * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-[0.55rem] font-black text-muted-foreground uppercase mb-1">GQ Signal</div>
                                <div className="text-sm font-black text-blue-400">{(d!.internalProb * 100).toFixed(1)}%</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {d!.diff > 0 ? <TrendingUp className="text-rose-400" size={14} /> : <TrendingDown className="text-emerald-400" size={14} />}
                                <span className="text-[0.65rem] font-black text-white uppercase tracking-widest leading-none">
                                    {Math.abs(d!.diff * 100).toFixed(1)}% Divergence
                                </span>
                            </div>
                            <Button
                                variant="text"
                                size="small"
                                href={d!.affiliate_url}
                                sx={{
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    fontWeight: 900,
                                    p: 0,
                                    minWidth: 0,
                                    '&:hover': { color: '#3b82f6', bg: 'transparent' }
                                }}
                            >
                                Trade Edge
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Decorative pulse */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-5 scale-150 pointer-events-none">
                <AlertTriangle size={200} />
            </div>
        </Box>
    );
};
