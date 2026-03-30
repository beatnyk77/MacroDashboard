import { createTheme } from '@mui/material/styles';

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
            h1: { 
                fontSize: typographyScale['4xl'],
                fontWeight: 800, 
                letterSpacing: '-0.025em',
                lineHeight: 1.15
            },
            h2: {
                fontSize: typographyScale['3xl'],
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
            },
            h3: {
                fontSize: typographyScale['2xl'],
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25
            },
            h4: { 
                fontSize: typographyScale['xl'],
                fontWeight: 700, 
                letterSpacing: '-0.02em',
                lineHeight: 1.3
            },
            h5: { 
                fontSize: typographyScale['lg'],
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.4
            },
            h6: { 
                fontSize: typographyScale['base'],
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.5
            },
            subtitle1: { 
                fontSize: typographyScale['sm'],
                letterSpacing: '0.01em', 
                fontWeight: 500,
                lineHeight: 1.35
            },
            body1: { 
                fontSize: typographyScale['base'],
                lineHeight: 1.5 
            },
            body2: {
                fontSize: typographyScale['sm'],
                lineHeight: 1.35
            },
            caption: { 
                fontSize: typographyScale['xs'],
                letterSpacing: '0.01em', 
                fontWeight: 500,
                lineHeight: 1.25
            },
        },
        spacing: 4, // Aligned with 4px tailwind base unit
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: mode === 'dark'
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        backgroundImage: 'none',
                        backgroundColor: mode === 'dark' ? 'rgba(7, 15, 32, 0.4)' : '#ffffff',
                        backdropFilter: 'blur(12px)',
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

    return theme;
};

export default getTheme;

// ============================================================================
// DESIGN TOKENS - TAILWIND ALIGNMENT
// ============================================================================
// These tokens define the single source of truth for typography, spacing, etc.
// They must stay in sync with tailwind.config.js

import { cn } from '@/lib/utils';

// Typography scale (8-step modular scale, base: 0.9375rem, ratio: 1.25)
// Corresponds to tailwind.config.js fontSize
export const typographyScale = {
	xs: '0.6875rem',   // 11px
	sm: '0.8125rem',   // 13px
	base: '0.9375rem', // 15px
	lg: '1.125rem',    // 18px
	xl: '1.375rem',    // 22px
	'2xl': '1.719rem', // 27.5px
	'3xl': '2.148rem', // 34.4px
	'4xl': '2.685rem', // 43px
};

// Corresponding Tailwind utility class mappings
export const typographyClassMap = {
	xs: 'text-xs',
	sm: 'text-sm',
	base: 'text-base',
	lg: 'text-lg',
	xl: 'text-xl',
	'2xl': 'text-2xl',
	'3xl': 'text-3xl',
	'4xl': 'text-4xl',
};

// Tracking utilities (strictly enforced)
export const tracking = {
	heading: 'tracking-heading',   // -0.02em
	body: 'tracking-body',         // 0
	uppercase: 'tracking-uppercase', // 0.1em
};

// Font weight utilities
export const fontWeight = {
	normal: 'font-normal',
	medium: 'font-medium',
	semibold: 'font-semibold',
	bold: 'font-bold',
	extrabold: 'font-extrabold',
	black: 'font-black',
};

// Vertical spacing scale (4px base unit)
// Matches tailwind.config.js spacing
export const spacingScale = {
	0: '0',
	1: '0.25rem',   // 4px
	2: '0.5rem',    // 8px
	3: '0.75rem',   // 12px
	4: '1rem',      // 16px
	5: '1.25rem',   // 20px
	6: '1.5rem',    // 24px
	8: '2rem',      // 32px
	10: '2.5rem',   // 40px
	12: '3rem',     // 48px
	16: '4rem',     // 64px
	20: '5rem',     // 80px
};

export const spacingClassMap = {
	0: 'space-y-0',
	1: 'space-y-1',
	2: 'space-y-2',
	3: 'space-y-3',
	4: 'space-y-4',
	5: 'space-y-5',
	6: 'space-y-6',
	8: 'space-y-8',
	10: 'space-y-10',
	12: 'space-y-12',
	16: 'space-y-16',
	20: 'space-y-20',
};

// Section gaps
export const sectionGap = {
	minor: 'gap-4',   // 16px - between related subsections
	major: 'gap-6',   // 24px - between major sections
	card: 'gap-5',    // 20px - between cards
};

// Z-index scale
export const zIndex = {
	base: 0,
	dropdown: 1000,
	sticky: 1100,
	tooltip: 1200,
	modal: 1300,
	toast: 1400,
};

// Legacy metricTypography (kept for backward compatibility)
export const metricTypography = {
	hero: {
		fontSize: '3rem',
		fontWeight: 800,
		lineHeight: 1.1,
		letterSpacing: '-0.02em'
	},
	primary: {
		fontSize: '2rem',
		fontWeight: 700,
		lineHeight: 1.2,
		letterSpacing: '-0.01em'
	},
	secondary: {
		fontSize: '1.25rem',
		fontWeight: 600,
		lineHeight: 1.3
	},
	label: {
		fontSize: '0.75rem',
		fontWeight: 600,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.1em',
		color: 'text.secondary'
	},
};

// Terminal color palette
export const terminalColors = {
	bg: 'bg-terminal-bg',
	header: 'bg-terminal-header',
	border: 'border-terminal-border',
	gold: 'text-terminal-gold',
	emerald: 'text-terminal-emerald',
	rose: 'text-terminal-rose',
	muted: 'text-terminal-muted',
	blue: 'text-terminal-blue',
};

export const cx = cn;
