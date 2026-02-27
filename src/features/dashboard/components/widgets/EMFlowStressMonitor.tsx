import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useEMFlowStress } from '@/hooks/useEMFlowStress';

export const EMFlowStressMonitor: React.FC = () => {
    const { data, loading } = useEMFlowStress();

    if (loading || !data) {
        return (
            <Box sx={{ p: 4, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rectangular" height={120} sx={{ my: 2, borderRadius: '12px' }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    <Skeleton variant="rectangular" height={60} />
                    <Skeleton variant="rectangular" height={60} />
                    <Skeleton variant="rectangular" height={60} />
                </Box>
            </Box>
        );
    }

    const { status, sparkline, netFlow30D, zScore, vsAvg } = data;
    const isStress = status === 'CRITICAL';
    const isWatch = status === 'WATCH';

    const getStatusColor = () => {
        if (isStress) return '#f43f5e';
        if (isWatch) return '#f59e0b';
        return '#3b82f6';
    };

    const statusColor = getStatusColor();

    return (
        <Box sx={{ p: 4, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', tracking: '-0.02em', color: statusColor }}>
                        EM Flow Stress Monitor
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                        Aggregate Emerging Market capital flight telemetry
                    </Typography>
                </Box>
                {(isStress || isWatch) && (
                    <Box sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 'full',
                        bgcolor: `${statusColor}1A`,
                        border: `1px solid ${statusColor}33`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <AlertCircle size={12} color={statusColor} />
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: statusColor, textTransform: 'uppercase' }}>
                            {isStress ? 'Shock Detected' : 'Elevated Pressure'}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ height: 120, mb: 4 }}>
                <Sparkline
                    data={sparkline}
                    color={statusColor}
                    height={120}
                />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Net Flow (30D)</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: statusColor }}>{netFlow30D}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: statusColor }}>
                        {netFlow30D.startsWith('-') ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>{vsAvg}</Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Z-Score</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: statusColor }}>{zScore.toFixed(2)}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
                        {Math.abs(zScore) > 2 ? 'Critical Threshold' : 'Recent Volatility'}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Regime</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: statusColor, textTransform: 'uppercase' }}>{status}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
                        {isStress ? 'Capital Flight' : isWatch ? 'Flow Tension' : 'Stable Inflows'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
