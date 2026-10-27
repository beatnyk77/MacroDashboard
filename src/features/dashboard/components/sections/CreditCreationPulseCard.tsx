import React from 'react';
import { Box, Grid, Typography, useTheme, Paper } from '@mui/material';
import { useInstitutionalFeatures, CreditPulse } from '@/hooks/useInstitutionalFeatures';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WHITE_ALPHA } from '@/constants/chartDefaults';

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
            bgcolor: WHITE_ALPHA.ghost,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&:hover': {
                bgcolor: WHITE_ALPHA.ghost,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{data.country_code}</Typography>
                </Box>
                <Box sx={{ color: getColor() }}>{getIcon()}</Box>
            </Box>

            <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Fira Code, monospace' }}>
                    {data.impulse_z_score.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Impulse Z-Score
                </Typography>
            </Box>

            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${WHITE_ALPHA.faint}` }}>
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
            <h3 className="text-xl font-light text-white flex items-center gap-2 mb-4">
                <span className="w-8 h-px bg-emerald-500/50" />
                Credit Creation Pulse (Z-Score)
            </h3>
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
