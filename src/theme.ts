import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const getTheme = (mode: 'light' | 'dark') => {
    const theme = createTheme({
        palette: {
            mode,
            background: {
                default: mode === 'dark' ? '#0f172a' : '#f8fafc',
                paper: mode === 'dark' ? '#1e293b' : '#ffffff',
            },
            text: {
                primary: mode === 'dark' ? '#e2e8f0' : '#1e293b',
                secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
            },
            primary: {
                main: '#3b82f6', // Bright blue
            },
            secondary: {
                main: '#10b981', // Emerald
            },
            error: {
                main: '#ef4444',
            },
            warning: {
                main: '#f59e0b',
            },
            success: {
                main: '#10b981',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 700 },
            h3: { fontWeight: 600 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            subtitle1: { letterSpacing: '0.025em' },
            body1: { lineHeight: 1.6 },
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: mode === 'dark'
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        backgroundImage: 'none',
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
                        scrollbarColor: mode === 'dark' ? '#334155 #0f172a' : '#cbd5e1 #f8fafc',
                        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                            backgroundColor: 'transparent',
                            width: 8,
                        },
                        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                            borderRadius: 8,
                            backgroundColor: mode === 'dark' ? '#334155' : '#cbd5e1',
                            minHeight: 24,
                        },
                        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                            backgroundColor: mode === 'dark' ? '#475569' : '#94a3b8',
                        },
                    },
                },
            },
        },
        shape: {
            borderRadius: 8,
        },
    });

    return responsiveFontSizes(theme);
};

export default getTheme;
