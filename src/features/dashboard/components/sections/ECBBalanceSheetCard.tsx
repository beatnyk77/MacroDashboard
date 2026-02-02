import { MetricCard } from '@/components/MetricCard';
import { useECBBalanceSheet } from '@/hooks/useECBBalanceSheet';

export const ECBBalanceSheetCard: React.FC = () => {
    const { data, isLoading } = useECBBalanceSheet();

    if (isLoading || !data) {
        return <MetricCard label="ECB Balance Sheet" value="-" isLoading={true} />;
    }

    const { excessLiquidity, totalAssets, mro, df } = data;

    const stats = [
        {
            label: 'Total Assets',
            value: totalAssets ? `€${(totalAssets.value / 1e6).toFixed(2)}T` : '-',
            color: 'primary.main'
        },
        {
            label: 'MRO',
            value: mro ? `€${(mro.value / 1e3).toFixed(1)}B` : '-'
        },
        {
            label: 'Deposit Facility',
            value: df ? `€${(df.value / 1e3).toFixed(1)}B` : '-'
        }
    ];

    return (
        <MetricCard
            label="ECB Excess Liquidity"
            value={excessLiquidity ? `€${(excessLiquidity.value / 1e6).toFixed(2)}T` : '-'}
            delta={excessLiquidity?.delta !== null ? {
                value: `${(excessLiquidity!.delta! / 1e3).toFixed(1)}B`,
                period: 'WoW',
                trend: excessLiquidity!.delta! >= 0 ? 'up' : 'down'
            } : undefined}
            isLoading={isLoading}
            lastUpdated={excessLiquidity?.as_of_date}
            history={excessLiquidity?.history}
            suffix=""
            description="Excess liquidity is the amount of funds held by banks in the Eurosystem that exceeds their requirements. It is a key proxy for balance sheet expansion."
            methodology="Computed as: Total Assets - (Current Account + Deposit Facility). Proxy for ECB monetary policy stance."
            source="ECB (via FRED)"
            stats={stats}
        />
    );
};
