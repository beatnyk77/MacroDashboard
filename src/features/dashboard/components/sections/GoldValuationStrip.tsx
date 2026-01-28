import { Box, Typography, useTheme, Tooltip } from '@mui/material';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { useIngestionStatus } from '@/hooks/useIngestionStatus';
import { useGoldRatioHistory } from '@/hooks/useGoldRatioHistory';
import { Sparkline } from '@/components/Sparkline';
import { Info } from 'lucide-react';

export const GoldValuationStrip: React.FC = () => {
    const theme = useTheme();
    const { data: ratios } = useGoldRatios();
    const { data: gold } = useLatestMetric('GOLD_PRICE_USD');
    const { data: status } = useIngestionStatus();
    const { data: history } = useGoldRatioHistory(90);

    const getRatio = (name: string) => ratios?.find((r: any) => r.ratio_name === name);
    const m2Gold = getRatio('M2/Gold');
    const spxGold = getRatio('SPX/Gold');
    const debtGold = getRatio('DEBT/Gold');
    const goldSilver = getRatio('Gold/Silver');

    const getRatioHistory = (name: string) => {
        if (!history) return [];
        return history.map(d => ({
            date: d.date,
            value: d.ratios.find(r => r.ratio_name === name)?.value || 0
        })).filter(v => v.value !== 0);
    };

    const getZColor = (z?: number) => {
        if (!z) return 'text.disabled';
        if (z > 1.5) return theme.palette.error.main;
        if (z < -1.5) return theme.palette.success.main;
        return theme.palette.text.secondary;
    };

    return (
        <Box sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 1100,
            bgcolor: 'rgba(2, 6, 23, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '2px solid',
            borderColor: 'rgba(255,215,0,0.1)',
            py: { xs: 1.5, md: 1.5 }, // Slightly thinner for professionalism
            px: { xs: 2.5, md: 6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            width: '100%',
            left: 0
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 6 } }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '0.15em', display: 'block', fontSize: '0.6rem' }}>
                            LIVE ANCHOR
                        </Typography>
                        <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', px: 0.5, borderRadius: 0.5, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: 'primary.main' }}>25Y CYCLE</Typography>
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' }, letterSpacing: '-0.02em' }}>
                        GOLD ${gold?.value.toLocaleString() || '-'}
                    </Typography>
                </Box>

                <Box sx={{ width: '1px', height: 32, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />

                {[
                    { label: 'M2/GOLD', data: m2Gold, name: 'M2/Gold' },
                    { label: 'SPX/GOLD', data: spxGold, name: 'SPX/Gold' },
                    { label: 'DEBT/GOLD (Bn)', data: debtGold, name: 'DEBT/Gold' },
                    { label: 'GOLD/SILVER', data: goldSilver, name: 'Gold/Silver' }
                ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                                    {item.label}
                                </Typography>
                                {item.name === 'Gold/Silver' && (
                                    <Tooltip title="Historical context: 50y average around 60. Current relative to 25y window." arrow>
                                        <Info size={10} style={{ opacity: 0.5, cursor: 'help' }} />
                                    </Tooltip>
                                )}
                            </Box>
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
                        <Box sx={{ width: 40, height: 20, mt: 1, display: { xs: 'none', md: 'block' } }}>
                            <Sparkline data={getRatioHistory(item.name)} color={getZColor(item.data?.z_score)} height={20} />
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                        LAST INGESTION (UTC)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Box sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: status?.last_ingestion_at ? 'success.main' : 'error.main',
                            boxShadow: status?.last_ingestion_at ? `0 0 10px ${theme.palette.success.main}` : 'none'
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                            {status?.last_ingestion_at ? new Date(status.last_ingestion_at).toLocaleTimeString() : 'OFFLINE'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
