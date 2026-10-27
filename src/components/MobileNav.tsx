import React, { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Globe, ShieldAlert, FileText, LayoutDashboard, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

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
                        case 2: navigate('/labs/us-macro-fiscal'); break;
                        case 3: navigate('/intel/india'); break;
                        case 4: navigate('/institutional'); break;
                    }
                }}
                sx={{
                    bgcolor: alpha(CHART_COLORS.panel, 0.92),
                    backdropFilter: 'blur(16px)',
                    borderTop: `1px solid ${WHITE_ALPHA.line}`,
                    width: '100%',
                    minWidth: 0,
                    boxShadow: 'none',
                    '& .MuiBottomNavigationAction-root': {
                        color: CHART_COLORS.label,
                        flex: '1 1 0',
                        minWidth: 0,
                        maxWidth: 'none',
                        padding: '6px 2px',
                        '&.Mui-selected': {
                            color: CHART_COLORS.west,
                        },
                        '& .MuiBottomNavigationAction-label': {
                            fontSize: '0.6875rem',
                            whiteSpace: 'nowrap',
                            '&.Mui-selected': {
                                fontSize: '0.6875rem',
                            }
                        }
                    }
                }}
            >
                <BottomNavigationAction label="Home" icon={<LayoutDashboard size={18} />} />
                <BottomNavigationAction label="Digest" icon={<FileText size={18} />} />
                <BottomNavigationAction label="Labs" icon={<FlaskConical size={18} />} />
                <BottomNavigationAction label="India" icon={<Globe size={18} />} />
                <BottomNavigationAction label="Insti" icon={<ShieldAlert size={18} />} />
            </BottomNavigation>
        </Paper>
    );
};
