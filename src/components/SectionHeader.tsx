import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { exportSectionToPDF, exportSectionToPNG } from '@/utils/exportUtils';
import { Tooltip, IconButton, Box, Typography } from '@mui/material';
import { DataQualityBadge } from './DataQualityBadge';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    exportId?: string; // ID of the container to export
    lastUpdated?: Date | string | null;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    icon,
    action,
    exportId,
    lastUpdated
}) => {
    return (
        <Box sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            pl: 2,
            '&:hover .export-controls': { opacity: 1 }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {icon}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        {lastUpdated && (
                            <DataQualityBadge timestamp={lastUpdated} size="small" label={false} />
                        )}
                    </Box>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {exportId && (
                    <Box
                        className="export-controls"
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            mr: 2,
                            opacity: { xs: 1, md: 0 },
                            transition: 'opacity 0.2s',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            borderRadius: 1,
                            p: 0.5
                        }}
                    >
                        <Tooltip title="Export as PNG">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    exportSectionToPNG(exportId, title);
                                    gtag('event', 'export_data', {
                                        export_type: 'png',
                                        section_title: title
                                    });
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                            >
                                <ImageIcon size={14} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export as PDF">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    exportSectionToPDF(exportId, title, title);
                                    gtag('event', 'export_data', {
                                        export_type: 'pdf',
                                        section_title: title
                                    });
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                            >
                                <FileText size={14} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                {action}
            </Box>
        </Box>
    );
};
