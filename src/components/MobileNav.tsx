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
                        case 0: scrollToSection('top'); break;
                        case 1: scrollToSection('regime-section'); break;
                        case 2: scrollToSection('gold-section'); break;
                        case 3: scrollToSection('policy-section'); break;
                    }
                }}
                sx={{ bgcolor: 'background.paper' }}
            >
                <BottomNavigationAction label="Macro" icon={<LayoutDashboard size={20} />} />
                <BottomNavigationAction label="Regime" icon={<Activity size={20} />} />
                <BottomNavigationAction label="Assets" icon={<Coins size={20} />} />
                <BottomNavigationAction label="Policy" icon={<FileText size={20} />} />
            </BottomNavigation>
        </Paper>
    );
};
