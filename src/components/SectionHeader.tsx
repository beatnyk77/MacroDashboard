import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
    return (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderLeft: '3px solid', borderColor: 'primary.main', pl: 2 }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.2 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action}
        </Box>
    );
};
