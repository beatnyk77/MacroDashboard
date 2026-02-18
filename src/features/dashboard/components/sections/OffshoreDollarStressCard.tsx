import React from 'react';
import { MetricCard } from '@/components/MetricCard';
import { useInstitutionalFeatures } from '@/hooks/useInstitutionalFeatures';

export const OffshoreDollarStressCard: React.FC = () => {
    const { offshore } = useInstitutionalFeatures();
    const data = offshore.data;

    const isStressed = (data?.sofr_ois_spread || data?.ted_spread || 0) > 40 || (data?.slope_bps || 0) < 0;

    return (
        <MetricCard
            label="Offshore Dollar Funding Stress"
            value={data?.sofr_ois_spread !== undefined && data.sofr_ois_spread !== null
                ? `${data.sofr_ois_spread.toFixed(0)} bps`
                : (data?.ted_spread !== undefined ? `${data.ted_spread.toFixed(0)} bps` : '-')}
            isLoading={offshore.isLoading}
            status={isStressed ? 'danger' : 'safe'}
            sublabel={isStressed ? 'SYSTEMIC STRESS DETECTED' : 'LIQUIDITY CONDITIONS NORMAL'}
            description={
                <>
                    Measures institutional liquidity constraints using the SOFR-OIS Spread (modern replacement for TED Spread).
                    <span className="text-white/40 block mt-1">Reflects the premium for short-term wholesale dollar funding.</span>
                </>
            }
            methodology="High values in SOFR-OIS Spread (>40bps) indicate rising credit risk or balance sheet constraints in the Eurodollar market."
            source="CME Group, Bloomberg"
            lastUpdated={data?.as_of_date}
            stats={[
                {
                    label: 'SOFR-OIS Spread',
                    value: (data?.sofr_ois_spread !== undefined) ? `${data.sofr_ois_spread.toFixed(0)} bps` : (data?.ted_spread ? `${data.ted_spread.toFixed(0)} bps` : '-'),
                    color: (data?.sofr_ois_spread || data?.ted_spread || 0) > 40 ? 'error.main' : 'success.main'
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
