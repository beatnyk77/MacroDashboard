import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { RatioRow } from '@/components/spa/RatioRow';
import { Sparkline } from '@/components/Sparkline';
import { formatNumber } from '@/utils/formatNumber';

export const NetLiquidityRow: React.FC = () => {
    const { data: liquidity, isLoading } = useNetLiquidity();

    if (isLoading) {
        return (
            <div className="spa-card h-48 animate-pulse bg-white/5 rounded-2xl" />
        );
    }

    const value = liquidity?.current_value ? `$${formatNumber(liquidity.current_value / 1e12, { decimals: 2 })}T` : 'N/A';
    const trend = liquidity?.delta_pct && liquidity.delta_pct > 0 ? 'up' : 'down';

    return (
        <RatioRow
            title="Global Net Liquidity"
            value={value}
            subtitle="Aggregate G7 + EM central bank balance sheet + treasury flows"
            trend={trend}
            label="Macro Signal"
        >
            <div className="h-24 w-64">
                <Sparkline
                    data={liquidity?.history || []}
                    color={trend === 'up' ? '#3b82f6' : '#ef4444'}
                />
            </div>
        </RatioRow>
    );
};
