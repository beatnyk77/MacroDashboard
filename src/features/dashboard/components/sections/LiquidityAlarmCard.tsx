import { Card, Box, Typography, useTheme, Alert } from '@mui/material';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { Skeleton } from '@mui/material';

export const LiquidityAlarmCard: React.FC = () => {
    const theme = useTheme();
    const { data: liq, isLoading } = useNetLiquidity();

    if (isLoading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
    if (!liq) return null;

    const isExtreme = liq.alarm_status === 'EXTREME';
    const isTightening = liq.alarm_status === 'TIGHTENING';

    const getStatusColor = () => {
        if (isExtreme) return theme.palette.error.main;
        if (isTightening) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const getStatusIcon = () => {
        if (isExtreme) return <ShieldAlert size={20} />;
        if (isTightening) return <ShieldAlert size={20} />;
        return <ShieldCheck size={20} />;
    };

    return (
        <Card sx={{
            p: 3,
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: isExtreme ? 'error.main' : isTightening ? 'warning.main' : 'divider',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: `0 0 20px ${getStatusColor()}20`
            }
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: getStatusColor() }}>{getStatusIcon()}</Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                        LIQUIDITY ALARM
                    </Typography>
                </Box>
                <Box sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: `${getStatusColor()}20`,
                    border: `1px solid ${getStatusColor()}40`,
                    color: getStatusColor()
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                        {liq.alarm_status}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    ${liq.current_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}B
                </Typography>
                <Typography variant="body2" sx={{ color: liq.delta >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                    {liq.delta >= 0 ? '+' : ''}{liq.delta.toFixed(1)}B (Daily)
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block' }}>Z-SCORE (25Y)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: getStatusColor() }}>
                        {liq.z_score.toFixed(2)}σ
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block' }}>PERCENTILE</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {liq.percentile.toFixed(1)}%
                    </Typography>
                </Box>
            </Box>

            {(isExtreme || isTightening) && (
                <Alert
                    severity={isExtreme ? "error" : "warning"}
                    sx={{
                        mt: 'auto',
                        py: 0,
                        px: 1,
                        '& .MuiAlert-message': { fontSize: '0.75rem', fontWeight: 600 },
                        bgcolor: 'transparent',
                        border: 'none'
                    }}
                    icon={false}
                >
                    {isExtreme
                        ? "Extreme Deviation: Last similar event (Mar 2020) preceded SPX -34% correction."
                        : "Liquidity Tightening: Historical correlation suggests increased volatility ahead."}
                </Alert>
            )}

            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, opacity: 0.2, pointerEvents: 'none' }}>
                {/* Visual filler for trend */}
                <Box sx={{ width: '100%', height: '100%', bgcolor: getStatusColor() }} />
            </Box>
        </Card>
    );
};
