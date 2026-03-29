import React from 'react';
import { useIndiaMarketPulse } from '@/hooks/useIndiaMarketPulse';
import { formatNumber } from '@/utils/formatNumber';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@mui/material';
import { cn } from '@/lib/utils';

export const CompactIndiaCard: React.FC = () => {
    const { data: result, isLoading } = useIndiaMarketPulse();
    const data = result?.current;

    if (isLoading || !data) {
        return <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    return (
        <div className="p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex-1 max-w-xl">
                    <h3 className="text-xl font-black uppercase text-white mb-2 flex items-center gap-3">
                        <Activity className="text-blue-500" size={20} />
                        India Macro Pulse
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        High-frequency snapshot of institutional absorption (FII vs DII), derivative sentiment, and structural capital flows underpinning the India growth narrative.
                    </p>
                </div>

                <div className="flex flex-wrap gap-8 items-center bg-white/[0.02] p-6 rounded-xl border border-white/5">
                    <div>
                        <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">FII Net Flow</div>
                        <div className={cn("text-2xl font-black tabular-nums", data.fii_cash_net > 0 ? "text-emerald-500" : "text-rose-500")}>
                            {data.fii_cash_net > 0 ? '+' : ''}{formatNumber(data.fii_cash_net)}
                            <span className="text-xs ml-1 text-muted-foreground/50 uppercase">Cr</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">DII Net Flow</div>
                        <div className={cn("text-2xl font-black tabular-nums", data.dii_cash_net > 0 ? "text-emerald-500" : "text-rose-500")}>
                            {data.dii_cash_net > 0 ? '+' : ''}{formatNumber(data.dii_cash_net)}
                            <span className="text-xs ml-1 text-muted-foreground/50 uppercase">Cr</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">India VIX</div>
                        <div className="text-2xl font-black tabular-nums text-orange-400">
                            {data.india_vix?.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <Button
                    variant="text"
                    href="/labs/india"
                    endIcon={<ArrowRight size={16} />}
                    sx={{ color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                    Analyze Full India Pulse
                </Button>
            </div>
        </div>
    );
};
