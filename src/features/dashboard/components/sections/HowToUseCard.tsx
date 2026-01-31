import React from 'react';
import { Box, Card, Typography, Grid, Chip, useTheme, Stack, Divider } from '@mui/material';
import { HelpCircle, Info } from 'lucide-react';

interface ColorLegendItem {
    label: string;
    color: string;
    description: string;
}

interface IconLegendItem {
    label: string;
    icon: React.ReactElement;
    description: string;
}

type LegendItem = ColorLegendItem | IconLegendItem;

function isColorItem(item: LegendItem): item is ColorLegendItem {
    return 'color' in item;
}

export const HowToUseCard: React.FC = () => {
    const theme = useTheme();

    const legendItems: { category: string; items: LegendItem[] }[] = [
        {
            category: 'Regime Colors',
            items: [
                { label: 'Green / Safe', color: theme.palette.success.main, description: 'Positive momentum, expansion, favorable conditions' },
                { label: 'Orange / Warning', color: theme.palette.warning.main, description: 'Caution advised, elevated stress, transition phase' },
                { label: 'Red / Danger', color: theme.palette.error.main, description: 'Risk-off, contraction, crisis signals' },
                { label: 'Blue / Neutral', color: theme.palette.primary.main, description: 'Baseline state, no clear directional signal' },
            ] as ColorLegendItem[]
        },
        {
            category: 'Staleness Badges',
            items: [
                { label: 'Fresh', color: theme.palette.success.main, description: 'Data updated within expected interval' },
                { label: 'Lagged', color: theme.palette.warning.main, description: 'Data 1-2x past expected interval (still usable)' },
                { label: 'Very Lagged', color: theme.palette.error.main, description: 'Data >2x past expected interval (use with caution)' },
                { label: 'Intentional', color: theme.palette.text.disabled, description: 'Quarterly/annual metrics shown for context' },
            ] as ColorLegendItem[]
        },
        {
            category: 'Statistical Indicators',
            items: [
                { label: 'Z-Score', icon: <Info size={14} />, description: 'Standard deviations from historical mean. >+2 = extreme high, <-2 = extreme low. Uses 1-year (252d) or 5-year (1260d) rolling windows.' },
                { label: 'Percentile', icon: <Info size={14} />, description: 'Historical ranking (0-100). 95th percentile = only 5% of history was higher. Useful for regime identification.' },
            ] as IconLegendItem[]
        }
    ];

    const navTips = [
        'Click section headers to jump to detailed views',
        'Hover over metrics for methodology and data sources',
        'Charts are interactive - click to expand full historical view',
        'Staleness badges indicate data recency or intentional lag',
        'All data updated at regular intervals (not real-time intraday)',
    ];

    return (
        <Card sx={{
            mb: 4,
            p: { xs: 2.5, md: 4 },
            borderLeft: '4px solid',
            borderLeftColor: 'secondary.main',
            bgcolor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 120,
                height: 120,
                background: `radial-gradient(circle, ${theme.palette.secondary.main}08 0%, transparent 70%)`,
                zIndex: 0
            }} />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <HelpCircle size={24} color={theme.palette.secondary.main} />
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.01em' }}>
                        How to Use GraphiQuestor
                    </Typography>
                    <Chip
                        label="QUICK START"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(168, 85, 247, 0.1)',
                            color: 'secondary.light',
                            border: '1px solid',
                            borderColor: 'rgba(168, 85, 247, 0.3)',
                            fontWeight: 900,
                            fontSize: '0.6rem',
                            ml: 'auto'
                        }}
                    />
                </Box>

                <Grid container spacing={3}>
                    {/* Legend Sections */}
                    {legendItems.map((section, idx) => (
                        <Grid item xs={12} md={4} key={idx}>
                            <Box sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.02)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%'
                            }}>
                                <Typography variant="caption" sx={{
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.1em',
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    mb: 2,
                                    display: 'block'
                                }}>
                                    {section.category}
                                </Typography>
                                <Stack spacing={1.5} divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />}>
                                    {section.items.map((item, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                            {isColorItem(item) ? (
                                                <Box sx={{
                                                    mt: 0.5,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    bgcolor: item.color,
                                                    flexShrink: 0,
                                                    border: '2px solid',
                                                    borderColor: 'background.paper'
                                                }} />
                                            ) : (
                                                <Box sx={{ mt: 0.3, color: 'text.secondary', flexShrink: 0 }}>
                                                    {item.icon}
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary', mb: 0.3 }}>
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', lineHeight: 1.3 }}>
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>
                    ))}

                    {/* Navigation Tips */}
                    <Grid item xs={12}>
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(59, 130, 246, 0.03)',
                            border: '1px dashed',
                            borderColor: 'primary.main'
                        }}>
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 1.5,
                                display: 'block'
                            }}>
                                Navigation Tips
                            </Typography>
                            <Grid container spacing={1.5}>
                                {navTips.map((tip, idx) => (
                                    <Grid item xs={12} sm={6} md={4} key={idx}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                            <Box sx={{
                                                mt: 0.7,
                                                width: 5,
                                                height: 5,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                flexShrink: 0
                                            }} />
                                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                                                {tip}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>

                {/* Data Philosophy */}
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{
                        color: 'text.disabled',
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        display: 'block',
                        lineHeight: 1.5
                    }}>
                        <strong>Data Philosophy:</strong> GraphiQuestor is an opinionated macro observatory anchored through gold and liquidity lenses.
                        Metrics are selected for institutional research and thesis work, not intraday trading. All data is open-source compiled,
                        updated at regular intervals (daily/weekly/monthly/quarterly depending on source availability).
                        Use staleness badges as guidance for data recency.
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};
