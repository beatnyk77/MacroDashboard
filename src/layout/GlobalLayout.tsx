import React, { useMemo } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Chip, useTheme } from '@mui/material';
import { Activity } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const { data: regime } = useRegime();

    const regimeColor = useMemo(() => {
        if (!regime) return theme.palette.primary.main;
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return theme.palette.success.main;
        if (label.includes('tightening') || label.includes('slowdown')) return theme.palette.error.main;
        return theme.palette.primary.main;
    }, [regime, theme]);

    const bgTint = useMemo(() => {
        if (!regime) return 'transparent';
        const label = regime.regimeLabel.toLowerCase();
        // Very subtle tints
        if (label.includes('expansion') || label.includes('recovery')) return `rgba(16, 185, 129, 0.03)`;
        if (label.includes('tightening') || label.includes('slowdown')) return `rgba(244, 63, 94, 0.03)`;
        return 'transparent';
    }, [regime]);

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.default,
            backgroundImage: `radial-gradient(circle at 50% -20%, ${bgTint}, transparent 70%)`,
            transition: 'background-image 0.5s ease'
        }}>
            <AppBar
                position="sticky"
                color="default"
                elevation={0}
                sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(2, 6, 23, 0.8)', // Semi-transparent Slate 950
                    backdropFilter: 'blur(12px)',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 60, md: 72 }, px: { xs: 2, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 } }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            '&:hover': { cursor: 'pointer' }
                        }}>
                            <Activity color={regimeColor} size={28} style={{ filter: `drop-shadow(0 0 8px ${regimeColor}40)` }} />
                            <Typography variant="h5" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.04em', display: { xs: 'none', sm: 'block' } }}>
                                Graphi<Typography component="span" variant="h5" sx={{ fontWeight: 800, color: '#3b82f6' }}>Questor</Typography>
                            </Typography>
                        </Box>

                        {regime && (
                            <Chip
                                label={`DETECTION: ${regime.regimeLabel.toUpperCase()}`}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    bgcolor: `${regimeColor}15`,
                                    color: regimeColor,
                                    border: `1px solid ${regimeColor}30`,
                                    borderRadius: 1,
                                    letterSpacing: '0.05em',
                                    ml: { xs: 0, md: 1 }
                                }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column' }}>
                <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
                    {children}
                </Container>
            </Box>

            <Box component="footer" sx={{
                py: 4,
                px: { xs: 2, md: 6 },
                mt: 'auto',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                backgroundColor: 'rgba(2, 6, 23, 0.4)'
            }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    GraphiQuestor.com – Institutional Macro Intelligence Terminal | Data from FRED, US Treasury &amp; IMF
                </Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    {[
                        { label: 'Methodology', href: '/methodology' },
                        { label: 'Data Sources', href: '#' },
                        { label: 'API Reference', href: '#' }
                    ].map((link) => (
                        <Typography
                            key={link.label}
                            variant="caption"
                            component="a"
                            href={link.href}
                            sx={{
                                color: 'text.secondary',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                '&:hover': { color: 'primary.main' }
                            }}
                        >
                            {link.label}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};
