import React, { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Activity, Coins, FileText, LayoutDashboard } from 'lucide-react';

export const MobileNav: React.FC = () => {
    const [value, setValue] = useState(0);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to top if 'dashboard-top' or similar
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <Paper sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: { md: 'none' }, // Hide on desktop
            pb: 'env(safe-area-inset-bottom)' // Safe area for iOS
        }} elevation={3}>
            <BottomNavigation
                showLabels
                value={value}
                onChange={(_, newValue) => {
                    setValue(newValue);
                    // Map generic indexes to section IDs
                    switch (newValue) {
                        case 0: scrollToSection('liquidity-hero'); break;
                        case 1: scrollToSection('policy-geopolitics'); break;
                        case 2: scrollToSection('thematic-labs'); break;
                        case 3: scrollToSection('india-pulse'); break;
                    }
                }}
                sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(16px)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    '& .MuiBottomNavigationAction-root': {
                        color: 'rgba(255,255,255,0.4)',
                        '&.Mui-selected': {
                            color: '#3b82f6',
                        }
                    }
                }}
            >
                <BottomNavigationAction label="Macro" icon={<LayoutDashboard size={20} />} />
                <BottomNavigationAction label="Policy" icon={<FileText size={20} />} />
                <BottomNavigationAction label="Labs" icon={<Coins size={20} />} />
                <BottomNavigationAction label="India" icon={<Activity size={20} />} />
            </BottomNavigation>
        </Paper>
    );
};
