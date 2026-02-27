import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';
import { TrendingDown, AlertCircle } from 'lucide-react';

export const EMFlowStressMonitor: React.FC = () => {
    // Mock time-series data for capital flows
    const mockFlowData = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: 50 + Math.sin(i / 3) * 20 + Math.random() * 10 - (i > 20 ? 30 : 0) // Simulated shock at the end
    })), []);

    const isStress = true; // Signal stress based on recent data

    return (
        <Box sx={{ p: 4, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', tracking: '-0.02em', color: isStress ? '#f43f5e' : 'white' }}>
                        EM Flow Stress Monitor
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                        Aggregate Emerging Market capital flight telemetry
                    </Typography>
                </Box>
                {isStress && (
                    <Box sx={{ px: 2, py: 0.5, borderRadius: 'full', bgcolor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AlertCircle size={12} color="#f43f5e" />
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase' }}>Shock Detected</Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ h: 120, mb: 4 }}>
                <Sparkline
                    data={mockFlowData}
                    color={isStress ? '#f43f5e' : '#3b82f6'}
                    height={120}
                />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Net Flow (30D)</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>-$12.4B</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f43f5e' }}>
                        <TrendingDown size={12} />
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>-142% vs avg</Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Z-Score</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>-2.84</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>Critical Threshold</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Regime</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase' }}>Critical</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>Capital Flight</Typography>
                </Box>
            </Box>
        </Box>
    );
};
