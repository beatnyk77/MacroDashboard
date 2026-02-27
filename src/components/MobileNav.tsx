import React, { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Globe, ShieldAlert, FileText, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MobileNav: React.FC = () => {
    const [value, setValue] = useState(0);
    const navigate = useNavigate();

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
                    switch (newValue) {
                        case 0: navigate('/'); break;
                        case 1: navigate('/regime-digest'); break;
                        case 2: navigate('/macro-observatory'); break;
                        case 3: navigate('/institutional'); break;
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
                <BottomNavigationAction label="Home" icon={<LayoutDashboard size={20} />} />
                <BottomNavigationAction label="Digest" icon={<FileText size={20} />} />
                <BottomNavigationAction label="Observatory" icon={<Globe size={20} />} />
                <BottomNavigationAction label="Institutional" icon={<ShieldAlert size={20} />} />
            </BottomNavigation>
        </Paper>
    );
};
