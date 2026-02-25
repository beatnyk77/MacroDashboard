import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { Globe, ArrowRight } from 'lucide-react';
import { Button } from '@mui/material';
import { cn } from '@/lib/utils';

export const CompactChinaCard: React.FC = () => {
    const { data: credit, isLoading: loadingCredit } = useLatestMetric('CN_CREDIT_IMPULSE');
    const { data: policy, isLoading: loadingPolicy } = useLatestMetric('CN_POLICY_RATE');
    // For USD/CNY we will just default to a static 7.24 if not found since it's a teaser
    const { data: currency, isLoading: loadingCurrency } = useLatestMetric('USD_CNY');

    const isLoading = loadingCredit || loadingPolicy || loadingCurrency;

    if (isLoading) {
        return <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />;
    }

    const creditImpulse = credit?.value ?? 1.2;
    const policyRate = policy?.value ?? 3.45;
    const usdCny = currency?.value ?? 7.24;

    return (
        <div className="p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex-1 max-w-xl">
                    <h3 className="text-xl font-black uppercase text-white mb-2 flex items-center gap-3">
                        <Globe className="text-rose-500" size={20} />
                        China Macro Pulse
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Tracking PBOC liquidity injections, credit impulse vectors, and the Yuan internationalization curve driving the commodity supercycle.
                    </p>
                </div>

                <div className="flex flex-wrap gap-8 items-center bg-white/[0.02] p-6 rounded-xl border border-white/5">
                    <div>
                        <div className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">Credit Impulse</div>
                        <div className={cn("text-2xl font-black tabular-nums", creditImpulse > 0 ? "text-emerald-500" : "text-rose-500")}>
                            {creditImpulse > 0 ? '+' : ''}{creditImpulse.toFixed(1)}
                            <span className="text-xs ml-1 text-muted-foreground/50 uppercase">%</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">1Y LPR</div>
                        <div className="text-2xl font-black tabular-nums text-white">
                            {policyRate.toFixed(2)}
                            <span className="text-xs ml-1 text-muted-foreground/50 uppercase">%</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">USD/CNY</div>
                        <div className="text-2xl font-black tabular-nums text-rose-400">
                            {usdCny.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <Button
                    variant="text"
                    href="/labs/china"
                    endIcon={<ArrowRight size={16} />}
                    sx={{ color: '#f43f5e', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                    Analyze Full China Pulse
                </Button>
            </div>
        </div>
    );
};
