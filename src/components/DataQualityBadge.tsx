import React from 'react';
import { Chip } from '@mui/material';
import { getDataQuality } from '@/utils/dataQuality';

interface DataQualityBadgeProps {
    timestamp: Date | string | null;
    size?: 'small' | 'medium';
    label?: boolean; // Show text label or just indicator
}

/**
 * Unified data quality badge using green/yellow/red palette
 * Replaces scattered "NO DATA", "STALE", "LAGGED" badges
 * Reduces visual noise while maintaining data integrity signals
 */
export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
    timestamp,
    size = 'small',
    label = true
}) => {
    const quality = getDataQuality(timestamp);

    const config: Record<ReturnType<typeof getDataQuality>, {
        icon: string;
        color: string;
        label: string;
        bgOpacity: string;
    }> = {
        fresh: {
            icon: '✓',
            color: '#10b981', // green-500 from theme
            label: 'Fresh',
            bgOpacity: '15'
        },
        delayed: {
            icon: '⏱',
            color: '#f59e0b', // amber-500 from theme (yellow alternative)
            label: 'Delayed',
            bgOpacity: '15'
        },
        stale: {
            icon: '⚠',
            color: '#f43f5e', // rose-500 from theme (red)
            label: 'Stale',
            bgOpacity: '15'
        },
    };

    const { icon, color, label: labelText, bgOpacity } = config[quality];

    return (
        <Chip
            label={label ? labelText : icon}
            size={size}
            sx={{
                bgcolor: `${color}${bgOpacity}`,
                color,
                border: `1px solid ${color}40`,
                fontWeight: 600,
                fontSize: size === 'small' ? '0.7rem' : '0.8rem',
                height: size === 'small' ? 22 : 26,
                '& .MuiChip-label': {
                    px: 1,
                }
            }}
        />
    );
};
