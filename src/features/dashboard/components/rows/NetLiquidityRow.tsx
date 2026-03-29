import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { RatioRow } from '@/components/spa/RatioRow';
import { Sparkline } from '@/components/Sparkline';
import { formatNumber } from '@/utils/formatNumber';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';

export const NetLiquidityRow: React.FC = () => {
    const { data: liquidity } = useNetLiquidity();

    const value = liquidity?.current_value ? `$${formatNumber(liquidity.current_value / 1e3, { decimals: 2 })}T` : 'N/A';
    const trend = liquidity?.delta_pct && liquidity.delta_pct > 0 ? 'up' : 'down';

    return (
        <div className="space-y-4">
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
            
            <div className="flex justify-end pt-2">
                <DataProvenanceBadge 
                    source="FRED / Treasury" 
                    methodology="B/S Aggregation"
                    lastVerified={liquidity?.as_of_date || new Date()}
                    size="sm"
                />
            </div>
        </div>
    );
};

