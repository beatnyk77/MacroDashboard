import { Box, Typography } from '@mui/material';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { TrendingUp, TrendingDown, Circle, Activity } from 'lucide-react';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { usePreciousDivergence } from '@/hooks/usePreciousDivergence';

export const MarketPulseTicker: React.FC = () => {
    const { data: pulseData } = useMarketPulse();
    const { data: liqData } = useNetLiquidity();
    const { data: integrity } = useDataIntegrity();
    const { data: divergenceData } = usePreciousDivergence();

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

    // Add Precious Divergence
    if (divergenceData) {
        const goldSpread = divergenceData.find(d => d.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
        const silverSpread = divergenceData.find(d => d.metric_id === 'SILVER_COMEX_SHANGHAI_SPREAD_PCT');

        if (goldSpread) {
            rawItems.push({
                id: 'GOLD_SH_PREM',
                name: 'Gold SHFE Prem',
                value: goldSpread.value,
                delta_wow: goldSpread.delta_wow,
                staleness_flag: 'fresh'
            } as any);
        }
        if (silverSpread) {
            rawItems.push({
                id: 'SILVER_SH_PREM',
                name: 'Silver SHFE Prem',
                value: silverSpread.value,
                delta_wow: silverSpread.delta_wow,
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

    // Strategy: Exactly 12 high-signal signals, no duplication
    const priorityOrder = [
        'GOLD_PRICE_USD',
        'WTI_CRUDE',
        'SILVER_PRICE_USD',
        'DXY_INDEX',
        'VIX_INDEX',
        'UST_10Y_YIELD',
        'UST_10Y_2Y_SPREAD',
        'NET_LIQUIDITY',
        'BTC_PRICE',
        'SOFR_RATE',
        'GOLD_SH_PREM',
        'SILVER_SH_PREM'
    ];

    const items = priorityOrder.map(id => {
        // Find by ID or partial match
        return Array.from(uniqueItemsMap.values()).find((item: any) =>
            item.id === id || item.id.includes(id)
        );
    }).filter(Boolean) as any[];

    if (items.length === 0) return null;

    // CSS animation handles the loop, so we don't need to manually duplicate items array multiple times
    // However, for a "endless" effect in CSS with transform, we need at least two sets
    const displayItems = [...items, ...items];

    return (
        <Box sx={{
            width: '100%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            py: 1,
            bgcolor: 'rgba(2, 6, 23, 0.8)', // Consistently dark
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 1200,
            backdropFilter: 'blur(10px)'
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
                <Activity size={12} />
                <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.55rem', letterSpacing: '0.05em' }}>
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
                    animation: 'pulse-scroll 45s linear infinite',
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
                                mx: 4,
                                cursor: 'default'
                            }}>
                                <Circle
                                    size={4}
                                    fill={isPositive ? '#10b981' : '#ef4444'}
                                    color="transparent"
                                />

                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.6rem' }}>
                                    {item.name}
                                </Typography>

                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                    {isZScore ? `${item.value.toFixed(2)}σ` :
                                        item.id.includes('YIELD') || item.id.includes('SPREAD') || item.id.includes('RATE') ? `${item.value.toFixed(2)}%` :
                                            item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </Typography>

                                {!isZScore && item.delta_wow !== 0 && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: isPositive ? 'success.light' : 'error.light',
                                        gap: 0.2
                                    }}>
                                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.6rem' }}>
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
