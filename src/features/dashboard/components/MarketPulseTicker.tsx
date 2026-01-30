import { Box, Typography } from '@mui/material';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { TrendingUp, TrendingDown, Circle, Activity } from 'lucide-react';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';

export const MarketPulseTicker: React.FC = () => {
    const { data: pulseData } = useMarketPulse();
    const { data: liqData } = useNetLiquidity();
    const { data: integrity } = useDataIntegrity();
    const { data: ratioData } = useGoldRatios();

    // Consolidate all items first
    let rawItems = [...(pulseData || [])];

    // Add Net Liquidity
    if (liqData) {
        rawItems.push({
            id: 'NET_LIQUIDITY',
            name: 'Net Liquidity',
            value: liqData.current_value,
            delta_wow: liqData.delta,
            staleness_flag: 'fresh'
        } as any);
    }

    // Add Institutional Ratios
    if (ratioData) {
        const m2Gold = ratioData.find(r => r.ratio_name === 'M2/Gold');
        const goldSilver = ratioData.find(r => r.ratio_name === 'Gold/Silver' || r.ratio_name === 'Gold / Silver'); // Handle variation

        if (m2Gold) {
            rawItems.push({
                id: 'M2_GOLD_Z',
                name: 'M2 / Gold Z',
                value: m2Gold.z_score,
                delta_wow: 0,
                staleness_flag: 'fresh'
            } as any);
        }

        if (goldSilver) {
            rawItems.push({
                id: 'GOLD_SILVER',
                name: 'Gold / Silver',
                value: goldSilver.current_value,
                delta_wow: 0,
                staleness_flag: 'fresh'
            } as any);
        }
    }

    // De-duplicate items based on ID
    const uniqueItemsMap = new Map();
    rawItems.forEach(item => {
        if (!uniqueItemsMap.has(item.id)) {
            uniqueItemsMap.set(item.id, item);
        }
    });

    // Prioritize specific high-signal items for the sticky strip
    const priorityOrder = ['GOLD_PRICE_USD', 'WTI_CRUDE', 'SILVER_PRICE_USD', 'DXY_INDEX', 'VIX_INDEX', 'UST_10Y_YIELD', 'UST_10Y_2Y_SPREAD', 'NET_LIQUIDITY', 'BTC_PRICE', 'M2_GOLD_Z', 'GOLD_SILVER'];

    const items = Array.from(uniqueItemsMap.values())
        .filter((item: any) => priorityOrder.includes(item.id) || priorityOrder.some(p => item.id.includes(p)))
        .sort((a: any, b: any) => {
            const idxA = priorityOrder.findIndex(p => a.id.includes(p));
            const idxB = priorityOrder.findIndex(p => b.id.includes(p));
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });


    if (items.length === 0) return null;

    // Duplicate items for seamless loop
    const displayItems = [...items, ...items];


    return (
        <Box sx={{
            width: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            py: 1,
            bgcolor: 'rgba(0,0,0,0.2)',
        }}>
            {/* Data Integrity Badge */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.5,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                color: integrity?.status === 'healthy' ? '#10b981' : '#f59e0b',
                flexShrink: 0,
                bgcolor: integrity?.status === 'healthy' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)'
            }}>
                <Activity size={14} />
                <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                    {integrity?.status === 'healthy' ? 'INTEGRITY: OK' : 'INTEGRITY: LAGGED'}
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flexGrow: 1
            }}>
                <Box sx={{
                    display: 'flex',
                    animation: 'pulse-scroll 60s linear infinite',
                    '&:hover': {
                        animationPlayState: 'paused'
                    },
                    '@keyframes pulse-scroll': {
                        '0%': { transform: 'translateX(0)' },
                        '100%': { transform: 'translateX(-50%)' }
                    }
                }}>
                    {displayItems.map((item, idx) => {
                        const isPositive = item.delta_wow >= 0;
                        const isZScore = item.id.includes('_Z');

                        return (
                            <Box key={`${item.id}-${idx}`} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mx: 5,
                                cursor: 'default'
                            }}>
                                {/* Sentiment Pip */}
                                <Circle
                                    size={6}
                                    fill={isPositive ? '#10b981' : '#ef4444'}
                                    color="transparent"
                                    style={{ boxShadow: isPositive ? '0 0 8px #10b981' : '0 0 8px #ef4444' }}
                                />

                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                                    {item.name}
                                </Typography>

                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.75rem' }}>
                                    {isZScore ? `${item.value.toFixed(2)}σ` :
                                        item.id.includes('YIELD') || item.id.includes('SPREAD') ? `${item.value.toFixed(2)}%` :
                                            item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </Typography>

                                {!isZScore && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: isPositive ? 'success.light' : 'error.light',
                                        gap: 0.2
                                    }}>
                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>
                                            {Math.abs(item.delta_wow).toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};
