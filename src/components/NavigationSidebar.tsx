import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import {
    LayoutDashboard,
    Droplets,
    Coins,
    AlertTriangle,
    Globe,
    Flag,
    Table,
    BookOpen
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: 'top', label: 'Cockpit', icon: <LayoutDashboard size={20} /> },
    { id: 'global-liquidity-section', label: 'Liquidity', icon: <Droplets size={20} /> },
    { id: 'hard-asset-valuation-section', label: 'Hard Assets', icon: <Coins size={20} /> },
    { id: 'treasury-snapshot-section', label: 'Sovereign Stress', icon: <AlertTriangle size={20} /> },
    { id: 'de-dollarization-section', label: 'BRICS & De-USD', icon: <Globe size={20} /> },
    { id: 'china-macro-section', label: 'Country Pulses', icon: <Flag size={20} /> },
    { id: 'major-economies-section', label: 'Data Tables', icon: <Table size={20} /> },
    { id: 'how-to-use', label: 'Methodology', icon: <BookOpen size={20} /> },
];

export const NavigationSidebar: React.FC = () => {
    const theme = useTheme();
    const [activeId, setActiveId] = useState('top');

    useEffect(() => {
        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        };

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Detect when item is roughly in top-middle of view
            threshold: 0
        };

        const observer = new IntersectionObserver(handleIntersect, observerOptions);

        navItems.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) {
                observer.observe(el);
            }
        });

        return () => observer.disconnect();
    }, []);

    const handleNavClick = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // Offset for sticky header
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveId(id);
        }
    };

    return (
        <Box
            sx={{
                width: 240,
                height: 'calc(100vh - 72px)',
                position: 'sticky',
                top: 72,
                left: 0,
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
                py: 4,
                zIndex: 1200,
                overflowY: 'auto',
            }}
        >
            <List sx={{ px: 2 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        selected={activeId === item.id}
                        sx={{
                            borderRadius: 2,
                            mb: 1,
                            py: 1.5,
                            transition: 'all 0.2s ease',
                            borderLeft: '3px solid transparent',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(59, 130, 246, 0.08)',
                                color: 'primary.main',
                                borderLeft: `3px solid ${theme.palette.warning.main}`, // Gold accent for active
                                '& .lucide': {
                                    color: 'primary.main',
                                },
                            },
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: activeId === item.id ? 'primary.main' : 'text.secondary' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: activeId === item.id ? 700 : 500,
                                letterSpacing: '0.01em',
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ mt: 'auto', px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em', mb: 2, display: 'block' }}>
                    SIGNAL KEY
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Healthy</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Watch</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Danger</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
