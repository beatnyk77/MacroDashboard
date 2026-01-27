import React from 'react';
import { Box, Typography } from '@mui/material';
import { useRegime } from '@/hooks/useRegime';

export const StickyRegimeBar: React.FC = () => {
    const { data: regimeData } = useRegime();

    if (!regimeData) return null;

    const getRegimeColor = (label: string) => {
        if (label.includes('Expansion')) return '#10b981';
        if (label.includes('Tightening')) return '#ef4444';
        return '#3b82f6';
    };

    return (
        <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1200,
            bgcolor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1,
            px: 4,
            mx: -4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                    CURRENT REGIME
                </Typography>
                <Box sx={{
                    px: 1.5,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: `${getRegimeColor(regimeData.regimeLabel)}20`,
                    border: `1px solid ${getRegimeColor(regimeData.regimeLabel)}40`
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: getRegimeColor(regimeData.regimeLabel), fontSize: '0.75rem' }}>
                        {regimeData.regimeLabel.toUpperCase()}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    PULSE: {regimeData.pulseScore.toFixed(1)}
                </Typography>
                <Box sx={{ width: 100, height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ width: `${regimeData.pulseScore}%`, height: '100%', bgcolor: getRegimeColor(regimeData.regimeLabel) }} />
                </Box>
            </Box>
        </Box>
    );
};
