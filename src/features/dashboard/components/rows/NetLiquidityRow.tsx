import React from 'react';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { RatioRow } from '@/components/spa/RatioRow';
import { Sparkline } from '@/components/Sparkline';
import { formatNumber } from '@/utils/formatNumber';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { GQSignalBadge } from '@/components/GQSignalBadge';

import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';

export const NetLiquidityRow: React.FC = () => {
    const { data: liquidity } = useNetLiquidity();

    const value = liquidity?.current_value ? `$${formatNumber(liquidity.current_value / 1e3, { decimals: 2 })}T` : 'N/A';
    const trend = liquidity?.delta_pct && liquidity.delta_pct > 0 ? 'up' : 'down';

    return (
        <div className="space-y-4">
            <figure role="region" aria-label="US Net Liquidity Proxy Sparkline and Telemetry" className="m-0 p-0">
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
                
                <ChartAccessibleTranscript
                    takeaway={`US Net Liquidity stands at ${value} (${liquidity?.delta_pct ? `${liquidity.delta_pct > 0 ? '+' : ''}${liquidity.delta_pct.toFixed(2)}%` : 'stable'}). Net liquidity measures commercial bank reserve expansion: when the Treasury spends cash out of the TGA or counterparties drain the Reverse Repo Facility (RRP), high-powered reserves enter financial markets.`}
                    readingGuide="Net Liquidity = Federal Reserve Total Assets (WALCL) − Treasury General Account (TGA) − Overnight Reverse Repo Facility (ON RRP). Expanding net liquidity historically correlates with rising equity and crypto multiples."
                    searchKeywords={[
                        'US Net Liquidity',
                        'Fed Balance Sheet WALCL',
                        'Treasury General Account TGA',
                        'Overnight Reverse Repo RRP',
                        'Commercial Bank Reserves',
                        'Liquidity Z-Score',
                        'Quantitative Tightening QT'
                    ]}
                    dataRows={[
                        { label: 'Current Net Liquidity', value: value, change: liquidity?.delta_pct ? `${liquidity.delta_pct > 0 ? '+' : ''}${liquidity.delta_pct.toFixed(2)}%` : undefined },
                        { label: 'Trend Direction', value: trend === 'up' ? 'Expanding (Risk-On)' : 'Contracting (Risk-Off)' },
                        { label: 'As-Of Date', value: liquidity?.as_of_date || 'Latest Available' },
                    ]}
                />
            </figure>

            <div className="flex items-center justify-between pt-2">
                <GQSignalBadge
                    tooltip="Proprietary Z-Score: deviation of net liquidity (Fed assets − TGA − RRP) from its 3-year rolling mean, normalized by standard deviation."
                    href="/methods/net-liquidity-z-score/"
                />
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

