import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useInstitutionalFeatures } from '@/hooks/useInstitutionalFeatures';

export const OffshoreDollarStressCard: React.FC = () => {
    const { offshore } = useInstitutionalFeatures();
    const data = offshore.data;

    const isStressed = (data?.ted_spread || 0) > 50 || (data?.slope_bps || 0) < 0;

    return (
        <MetricCard
            label="Offshore Dollar Funding Stress"
            value={data?.ted_spread !== undefined && data?.ted_spread !== null ? `${data.ted_spread.toFixed(0)} bps` : '-'}
            isLoading={offshore.isLoading}
            status={isStressed ? 'danger' : 'safe'}
            sublabel={isStressed ? 'SYSTEMIC STRESS DETECTED' : 'LIQUIDITY CONDITIONS NORMAL'}
            description="Measures liquidity constraints in the Eurodollar market using the TED Spread (LIBOR-TBill) and the Eurodollar Futures Curve Slope."
            methodology="High values in TED Spread (>50bps) or an inverted curve slope (<0) indicate institutional credit stress and dollar scarcity."
            source="FRED, CME"
            lastUpdated={data?.as_of_date}
            stats={[
                {
                    label: 'TED Spread',
                    value: (data?.ted_spread !== undefined && data?.ted_spread !== null) ? `${data.ted_spread.toFixed(0)} bps` : '-',
                    color: (data?.ted_spread || 0) > 50 ? 'error.main' : 'success.main'
                },
                {
                    label: 'Curve Slope',
                    value: (data?.slope_bps !== undefined && data?.slope_bps !== null) ? `${data.slope_bps.toFixed(0)} bps` : '-',
                    color: (data?.slope_bps || 0) < 0 ? 'error.main' : 'success.main'
                }
            ]}
        />
    );
};
