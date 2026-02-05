import { createTheme, responsiveFontSizes } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface BreakpointOverrides {
        xs: true;
        sm: true;
        md: true;
        lg: true;
        xl: true;
        xxl: true;
    }
}

const getTheme = (mode: 'light' | 'dark') => {
    const theme = createTheme({
        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 960,
                lg: 1280,
                xl: 1600,
                xxl: 1920 // Custom breakout for ultra-wide
            }
        },
        palette: {
            mode,
            background: {
                default: mode === 'dark' ? '#020617' : '#f8fafc', // Slate 950
                paper: mode === 'dark' ? '#070f20' : '#ffffff',   // Deeper Slate 900
            },
            text: {
                primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
                secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
            },
            primary: {
                main: '#3b82f6', // Bright blue
                light: '#60a5fa',
                dark: '#2563eb',
            },
            secondary: {
                main: '#10b981', // Emerald
            },
            divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
            error: {
                main: '#f43f5e', // Rose 500
            },
            warning: {
                main: '#f59e0b', // Amber 500
            },
            success: {
                main: '#10b981', // Emerald 500
            },
            action: {
                hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
            }
        },
        typography: {
            fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.025em' },
            h2: {
                fontWeight: 800,
                letterSpacing: '-0.02em',
                // Responsive font sizing handled by responsiveFontSizes, but establishing base
            },
            h3: {
                fontWeight: 700,
                letterSpacing: '-0.01em',
            },
            h4: { fontWeight: 700, letterSpacing: '-0.01em' },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            subtitle1: { letterSpacing: '0.01em', fontWeight: 500 },
            body1: { lineHeight: 1.6 },
            caption: { letterSpacing: '0.01em', fontWeight: 500 },
        },
        spacing: 8, // Base unit = 8px
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16, // Softer but premium
                        boxShadow: mode === 'dark'
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        backgroundImage: 'none',
                        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: mode === 'dark' ? '#1e293b #020617' : '#cbd5e1 #f8fafc',
                        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                            backgroundColor: 'transparent',
                            width: 8,
                        },
                        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                            borderRadius: 8,
                            backgroundColor: mode === 'dark' ? '#1e293b' : '#cbd5e1',
                            minHeight: 24,
                            border: `2px solid ${mode === 'dark' ? '#020617' : '#f8fafc'}`,
                        },
                        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: mode === 'dark' ? '#334155' : '#94a3b8',
                        },
                    },
                },
            },
        },
        shape: {
            borderRadius: 12,
        },
    });

    // Custom typography overrides for desktops
    theme.typography.h2 = {
        ...theme.typography.h2,
        [theme.breakpoints.up('xs')]: { fontSize: '1.75rem' },
        [theme.breakpoints.up('md')]: { fontSize: '2rem' },
        [theme.breakpoints.up('lg')]: { fontSize: '2.25rem' },
    };

    theme.typography.h3 = {
        ...theme.typography.h3,
        [theme.breakpoints.up('xs')]: { fontSize: '1.5rem' },
        [theme.breakpoints.up('md')]: { fontSize: '1.75rem' },
        [theme.breakpoints.up('lg')]: { fontSize: '2rem' },
    };

    theme.typography.body1 = {
        ...theme.typography.body1,
        [theme.breakpoints.up('xs')]: { fontSize: '0.875rem' },
        [theme.breakpoints.up('md')]: { fontSize: '0.9375rem' },
        [theme.breakpoints.up('lg')]: { fontSize: '1rem' },
    };

    return responsiveFontSizes(theme);
};

export default getTheme;
