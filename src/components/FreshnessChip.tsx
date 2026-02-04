import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { CheckCircle, Clock, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export type FreshnessStatus = 'fresh' | 'lagged' | 'stale' | 'overdue' | 'no_data';

interface FreshnessChipProps {
    status: FreshnessStatus;
    lastUpdated?: string | Date;
    label?: string;
}

export const FreshnessChip: React.FC<FreshnessChipProps> = ({ status, lastUpdated, label }) => {
    const config = {
        fresh: {
            text: 'FRESH',
            color: 'success',
            icon: <CheckCircle size={10} />,
            bgcolor: 'rgba(16, 185, 129, 0.1)'
        },
        lagged: {
            text: 'LAGGED',
            color: 'warning',
            icon: <Clock size={10} />,
            bgcolor: 'rgba(245, 158, 11, 0.1)'
        },
        stale: {
            text: 'STALE',
            color: 'error',
            icon: <AlertTriangle size={10} />,
            bgcolor: 'rgba(239, 68, 68, 0.1)'
        },
        overdue: {
            text: 'OVERDUE',
            color: 'error',
            icon: <AlertCircle size={10} />,
            bgcolor: 'rgba(239, 68, 68, 0.2)'
        },
        no_data: {
            text: 'NO DATA',
            color: 'default',
            icon: <HelpCircle size={10} />,
            bgcolor: 'rgba(148, 163, 184, 0.1)'
        }
    };

    const current = config[status] || config.no_data;
    const displayText = label || current.text;

    const formattedDate = lastUpdated
        ? new Date(lastUpdated).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Unknown';

    return (
        <Tooltip title={`Last Updated: ${formattedDate}`} arrow placement="top">
            <Chip
                label={displayText}
                size="small"
                variant="outlined"
                sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    color: `${current.color}.main`,
                    borderColor: `${current.color}.main`,
                    bgcolor: current.bgcolor,
                    '& .MuiChip-label': { px: 1 },
                    border: '1px solid',
                    opacity: 0.9
                }}
            />
        </Tooltip>
    );
};
