import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useInstitutionalFeatures } from '@/hooks/useInstitutionalFeatures';

export const GeopoliticalRiskPulseCard: React.FC = () => {
    const { geoRisk } = useInstitutionalFeatures();
    const data = geoRisk.data;

    const isHighRisk = (data?.composite_z_score || 0) > 1.5;

    return (
        <MetricCard
            label="Geopolitical Risk Pulse"
            value={data ? data.composite_z_score.toFixed(2) : '-'}
            isLoading={geoRisk.isLoading}
            status={isHighRisk ? 'danger' : 'safe'}
            sublabel={isHighRisk ? 'Extreme Geopolitical Pricing' : 'Geopolitical Risk Contained'}
            zScore={data?.composite_z_score}
            description="Composite index measuring systemic risk through the lens of equity volatility (VIX), bond volatility (MOVE), and Gold price action."
            methodology="The Geopolitical Risk Index is an average of the rolling 1-year Z-scores of VIX, MOVE, and Gold. Levels above 1.5 indicate extreme geopolitical pricing in markets."
            source="Yahoo Finance, ICE BofA"
            lastUpdated={data?.as_of_date}
            history={data?.history}
            stats={[
                { label: 'VIX Z-Score', value: data?.vix_z.toFixed(1) || '-' },
                { label: 'MOVE Z-Score', value: data?.move_z.toFixed(1) || '-' },
                { label: 'Gold Z-Score', value: data?.gold_z.toFixed(1) || '-' }
            ]}
        />
    );
};
