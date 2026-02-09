import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { formatMetric } from '@/utils/formatMetric';
import { formatNumber } from '@/utils/formatNumber';

export const NetLiquidityCard: React.FC = () => {
    const { data: netLiq } = useNetLiquidity();

    return (
        <MetricCard
            label="Global Net Liquidity"
            value={formatMetric(netLiq ? (netLiq.current_value / 1e3) : 0, 'trillion', { showUnit: false })}
            delta={netLiq ? { value: formatDelta(netLiq.delta_pct, { decimals: 1, unit: '%' }) || '—', period: "WoW", trend: (netLiq.delta_pct || 0) > 0 ? 'up' : 'down' } : undefined}
            status={netLiq ? (netLiq.z_score > 1 ? 'danger' : netLiq.z_score < -1 ? 'warning' : 'safe') : undefined}
            suffix="T"
            isLoading={false}
            lastUpdated={netLiq?.as_of_date}
            history={netLiq?.history}
            zScore={netLiq?.z_score}
            percentile={netLiq?.percentile}
            description="Global Net Liquidity estimates the actual 'spendable' liquidity provided by the Federal Reserve, adjusted for the TGA and Repo drains."
            methodology="Institutional Formula: (Fed Assets - Treasury General Account Balance - Reverse Repo). Z-Score provides the deviation from the 3-year trend."
            source="Fed, US Treasury"
            stats={[
                { label: 'Fed Assets', value: `$${formatNumber(netLiq?.fed_assets ? netLiq.fed_assets / 1e6 : 0, { decimals: 2 })}T`, color: 'primary.main' },
                { label: 'TGA Balance', value: `$${formatNumber(netLiq?.tga_balance ? netLiq.tga_balance / 1e3 : 0, { decimals: 2 })}B` },
                { label: 'RRP Drainage', value: `$${formatNumber(netLiq?.rrp_balance ? netLiq.rrp_balance / 1e3 : 0, { decimals: 2 })}B` }
            ]}
        />
    );
};

// Helper for delta formatting since it's used here
const formatDelta = (val: number | null, options: any) => {
    if (val === null) return null;
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(options.decimals)}${options.unit || ''}`;
};
