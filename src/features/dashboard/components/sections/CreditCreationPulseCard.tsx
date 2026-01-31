import React from 'react';
import { Box, Grid, Typography, useTheme, Paper } from '@mui/material';
import { useInstitutionalFeatures, CreditPulse } from '@/hooks/useInstitutionalFeatures';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const FLAG_MAP: Record<string, string> = {
    US: '🇺🇸',
    CN: '🇨🇳',
    IN: '🇮🇳',
    EU: '🇪🇺',
    JP: '🇯🇵'
};

const CreditSubCard: React.FC<{ data: CreditPulse }> = ({ data }) => {
    const theme = useTheme();
    const isExpanding = data.impulse_z_score > 1;
    const isContracting = data.impulse_z_score < -1;

    const getColor = () => {
        if (isExpanding) return theme.palette.success.main;
        if (isContracting) return theme.palette.error.main;
        return theme.palette.text.secondary;
    };

    const getIcon = () => {
        if (isExpanding) return <TrendingUp size={16} />;
        if (isContracting) return <TrendingDown size={16} />;
        return <Minus size={16} />;
    };

    return (
        <Paper sx={{
            p: 2,
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
                bgcolor: 'rgba(255,255,255,0.04)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>{FLAG_MAP[data.country_code]}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.country_code}</Typography>
                </Box>
                <Box sx={{ color: getColor() }}>{getIcon()}</Box>
            </Box>

            <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                    {data.impulse_z_score.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Impulse Z-Score
                </Typography>
            </Box>

            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    12m Change: {data.change_12m.toLocaleString()}
                </Typography>
            </Box>
        </Paper>
    );
};

export const CreditCreationPulseCard: React.FC = () => {
    const { credit } = useInstitutionalFeatures();

    if (credit.isLoading) return null;

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.1em', mb: 2, display: 'block' }}>
                Credit Creation Pulse (Z-Score)
            </Typography>
            <Grid container spacing={2}>
                {credit.data?.map((c) => (
                    <Grid item xs={6} sm={4} md={2.4} key={c.country_code}>
                        <CreditSubCard data={c} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
