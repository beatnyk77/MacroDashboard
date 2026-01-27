import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, Chip, useTheme } from '@mui/material';
import { Activity } from 'lucide-react';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const theme = useTheme();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar
                position="sticky"
                color="default"
                elevation={0}
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default, // Match background for minimal look
                    backdropFilter: 'blur(8px)',
                    background: `linear-gradient(to bottom, ${theme.palette.background.default}EE, ${theme.palette.background.default}CC)`
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Activity color={theme.palette.primary.main} size={24} />
                        <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                            MacroPulse
                        </Typography>
                        <Chip
                            label="REGIME: INFLATIONARY BOOM"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{
                                height: 24,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: { xs: 'none', sm: 'flex' }
                            }}
                        />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {new Date().toISOString().split('T')[0]} • USD/JPY 148.2 • 10Y 4.12%
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 3, display: 'flex', flexDirection: 'column' }}>
                <Container maxWidth="xl" sx={{ flexGrow: 1 }}>
                    {children}
                </Container>
            </Box>

            <Box component="footer" sx={{ py: 3, px: 3, mt: 'auto', borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.background.paper }}>
                <Typography variant="caption" color="text.secondary">
                    © {new Date().getFullYear()} Macro Intelligence Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography
                        variant="caption"
                        component="a"
                        href="/methodology"
                        sx={{
                            color: 'text.secondary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                        }}
                    >
                        Methodology & Sources
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
