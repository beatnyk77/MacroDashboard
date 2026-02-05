import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useCopperGoldRatio } from '@/hooks/useCopperGoldRatio';
import { formatNumber } from '@/utils/formatNumber';
import { formatDelta } from '@/utils/formatMetric';

export const CopperGoldRatioCard: React.FC = () => {
    const { data, isLoading } = useCopperGoldRatio();

    return (
        <MetricCard
            label="Copper/Gold Ratio"
            value={data ? formatNumber(data.value, { decimals: 4 }) : '—'}
            delta={data ? {
                value: formatDelta(data.delta_yoy, { decimals: 1, unit: '%' }) || '—',
                period: 'YoY',
                trend: data.delta_yoy > 0 ? 'up' : 'down'
            } : undefined}
            status={data?.status}
            history={data?.history}
            isLoading={isLoading}
            lastUpdated={data?.last_updated}
            zScore={data?.z_score}
            description="The ratio of Copper price to Gold price. Often referred to as 'Dr. Copper', this ratio is a classic indicator of economic growth expectations vs. safe-haven demand."
            methodology="Ratio of COMEX Copper (HG=F) to COMEX Gold (GC=F). High ratio typically indicates institutional risk-on sentiment and industrial expansion. Z-Score calculated over rolling 252 trading days."
            source="Yahoo Finance"
        />
    );
};
