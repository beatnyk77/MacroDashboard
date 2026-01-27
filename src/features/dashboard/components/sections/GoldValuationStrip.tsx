import { Box, Typography, useTheme } from '@mui/material';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useGoldRatios } from '@/hooks/useGoldRatios';

export const GoldValuationStrip: React.FC = () => {
    const theme = useTheme();
    const { data: ratios } = useGoldRatios();
    const { data: gold } = useLatestMetric('GOLD_PRICE_USD');

    const getRatio = (name: string) => ratios?.find((r: any) => r.ratio_name === name);
    const m2Gold = getRatio('M2/Gold');
    const spxGold = getRatio('SPX/Gold');

    const getZColor = (z?: number) => {
        if (!z) return 'text.disabled';
        if (z > 2) return theme.palette.error.main;
        if (z < -2) return theme.palette.success.main;
        return theme.palette.text.secondary;
    };

    return (
        <Box sx={{
            position: 'sticky',
            bottom: { xs: 0, md: 0 },
            zIndex: 1100,
            bgcolor: 'rgba(2, 6, 23, 0.9)', // Slate 950
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            py: { xs: 1, md: 2 },
            px: { xs: 2, md: 6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
            width: '100%',
            left: 0
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2.5, md: 6 } }}>
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '0.15em', display: 'block', fontSize: '0.6rem' }}>
                        LIVE ANCHOR
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                        GOLD ${gold?.value.toLocaleString() || '-'}
                    </Typography>
                </Box>

                <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />

                {[
                    { label: 'M2/GOLD', data: m2Gold },
                    { label: 'SPX/GOLD', data: spxGold }
                ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                            {item.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                                {item.data?.current_value.toFixed(2) || '-'}
                            </Typography>
                            {item.data?.z_score !== undefined && (
                                <Typography variant="caption" sx={{
                                    fontWeight: 900,
                                    color: getZColor(item.data.z_score),
                                    fontSize: '0.65rem',
                                    bgcolor: `${getZColor(item.data.z_score)}15`,
                                    px: 0.5,
                                    borderRadius: 0.5
                                }}>
                                    Z: {item.data.z_score > 0 ? '+' : ''}{item.data.z_score.toFixed(1)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                        SYSTEM STATUS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Box sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            boxShadow: `0 0 10px ${theme.palette.success.main}`
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                            OPERATIONAL
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
