import React, { useMemo, useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Chip, useTheme, Stack } from '@mui/material';
import { Activity, Clock } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { SocialShareMode } from '@/components/SocialShareMode';
import { MobileNav } from '@/components/MobileNav';
import { DashboardFooter } from '@/layout/DashboardFooter';
import { NavigationSidebar } from '@/components/NavigationSidebar';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const { data: regime } = useRegime();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshCountdown, setRefreshCountdown] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const countdown = setInterval(() => {
            setRefreshCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
        }, 1000);
        return () => clearInterval(countdown);
    }, []);

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
                    zIndex: 1300
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
                                <Typography component="span" variant="body2" sx={{ ml: 1, fontWeight: 600, color: 'text.disabled', letterSpacing: '0.05em', verticalAlign: 'middle', display: { xs: 'none', md: 'inline' } }}>
                                    – MACRO OBSERVATORY
                                </Typography>
                            </Typography>
                        </Box>

                        <Box sx={{ height: 24, width: '1px', bgcolor: 'divider', mx: 1, display: { xs: 'none', md: 'block' } }} />

                        <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', display: 'block', lineHeight: 1, fontSize: '0.6rem' }}>
                                    LOCAL TIME
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', display: 'block', lineHeight: 1, fontSize: '0.6rem' }}>
                                    DATE
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.75rem' }}>
                                    {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Clock size={12} color={theme.palette.text.disabled} />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                                NEXT REFRESH: <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 900 }}>{refreshCountdown}s</Typography>
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
                                    letterSpacing: '0.05em'
                                }}
                            />
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                {/* Navigation Sidebar (Desktop Only) */}
                <NavigationSidebar />

                <Box component="main" sx={{
                    flexGrow: 1,
                    py: { xs: 2, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    overflowX: 'hidden'
                }}>
                    <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
                        {children}
                    </Container>
                </Box>
            </Box>


            {/* Dashboard Footer with Disclaimer & Data Transparency */}
            <DashboardFooter />

            <SocialShareMode />
            <MobileNav />
        </Box>
    );
};

