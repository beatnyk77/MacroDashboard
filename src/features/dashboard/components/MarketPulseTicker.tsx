import { Box, Typography } from '@mui/material';
import { useMarketPulse } from '@/hooks/useMarketPulse';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MarketPulseTicker: React.FC = () => {
    const { data: pulseData } = useMarketPulse();
    const { data: liqData } = useNetLiquidity();

    const items = [...(pulseData || [])];
    if (liqData) {
        items.push({
            id: 'NET_LIQUIDITY',
            name: 'Net Liquidity',
            value: liqData.current_value,
            delta_wow: liqData.delta,
            staleness_flag: 'fresh'
        } as any);
    }

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
            py: 0.5,
            bgcolor: 'transparent'
        }}>
            <Box sx={{
                display: 'flex',
                animation: 'pulse-scroll 40s linear infinite',
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
                    return (
                        <Box key={`${item.id}-${idx}`} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mx: 4,
                            cursor: 'default'
                        }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {item.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                {item.id.includes('YIELD') || item.id.includes('SPREAD') ? `${item.value.toFixed(2)}%` : item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: isPositive ? 'success.main' : 'error.main',
                                gap: 0.2
                            }}>
                                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>
                                    {Math.abs(item.delta_wow).toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};
