import React from 'react';
import { Box, Typography, Tooltip, Skeleton } from '@mui/material';
import { AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useCapitalFlows } from '@/hooks/useCapitalFlows';

interface CapitalFlowCellProps {
    country: string;
    assetClass: string;
    status: 'NORMAL' | 'WATCH' | 'CRITICAL';
    zScore: number;
}

const CapitalFlowCell: React.FC<CapitalFlowCellProps> = ({ country, assetClass, status, zScore }) => {
    const getColors = () => {
        switch (status) {
            case 'CRITICAL': return { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e', icon: <AlertTriangle size={14} /> };
            case 'WATCH': return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b', icon: <Activity size={14} /> };
            default: return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', icon: <ShieldCheck size={14} /> };
        }
    };

    const colors = getColors();

    return (
        <Tooltip title={`${country} ${assetClass}: Z-Score ${zScore.toFixed(2)} (${status})`} arrow>
            <Box
                sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        bgcolor: colors.bg.replace('0.1', '0.15'),
                    }
                }}
            >
                <Box sx={{ color: colors.text }}>{colors.icon}</Box>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: colors.text, textTransform: 'uppercase', tracking: '0.1em' }}>
                    {country}
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                    {assetClass}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export const GlobalCapitalFlowRadar: React.FC = () => {
    const { data: flows, loading } = useCapitalFlows();
    const countries = ['US', 'EU', 'CN', 'JP', 'IN', 'BR'];
    const assetClasses = ['Equity', 'Debt', 'Reserves'];

    // Map fetched flows to the grid structure, fallback to neutral if missing
    const displayData = countries.flatMap(c =>
        assetClasses.map(a => {
            const flow = flows.find(f => f.country === c && f.assetClass === a);
            return flow || {
                country: c,
                assetClass: a,
                status: 'NORMAL' as const,
                zScore: 0
            };
        })
    );

    return (
        <Box sx={{ p: 4, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', tracking: '-0.02em' }}>
                        Capital Flow Radar
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                        Cross-border asset class regime detection
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {['NORMAL', 'WATCH', 'CRITICAL'].map(r => (
                        <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r === 'NORMAL' ? '#10b981' : r === 'WATCH' ? '#f59e0b' : '#f43f5e' }} />
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: 'text.secondary' }}>{r}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' },
                gap: 2
            }}>
                {loading ? (
                    Array(18).fill(0).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={80}
                            sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)' }}
                        />
                    ))
                ) : (
                    displayData.map((d, i) => (
                        <CapitalFlowCell key={i} {...d} />
                    ))
                )}
            </Box>
        </Box>
    );
};
