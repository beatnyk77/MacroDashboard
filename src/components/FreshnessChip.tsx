import React, { useMemo } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { CheckCircle, Clock, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { formatProvenanceTag, formatSourceRef } from '@/lib/formatProvenance';

export type FreshnessStatus = 'fresh' | 'lagged' | 'stale' | 'overdue' | 'no_data';

interface FreshnessChipProps {
    status: FreshnessStatus;
    lastUpdated?: string | Date;
    label?: string;
    /** When true, overrides chip colour to amber and shows a provisional-data tooltip. */
    isProvisional?: boolean;
    /** Structured provenance tag from metric_observations.source_ref */
    sourceRef?: string | null;
    /** Legacy provenance enum (api_live, fallback_snapshot, …) */
    provenance?: string | null;
}

const STATUS_CONFIG = {
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
} as const;

const FreshnessChipInner: React.FC<FreshnessChipProps> = ({
    status,
    lastUpdated,
    label,
    isProvisional,
    sourceRef,
    provenance,
}) => {
    const current = STATUS_CONFIG[status] || STATUS_CONFIG.no_data;
    const provisional = isProvisional === true;
    const displayText = label || (provisional ? 'PROVISIONAL' : current.text);

    const chipColor = provisional ? 'warning' : current.color;
    const chipBg = provisional ? 'rgba(245, 158, 11, 0.1)' : current.bgcolor;

    const formattedDate = useMemo(
        () => lastUpdated
            ? new Date(lastUpdated).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Unknown',
        [lastUpdated]
    );

    const provenanceLine = useMemo(() => {
        if (sourceRef) return formatSourceRef(sourceRef);
        const legacy = formatProvenanceTag(provenance);
        return legacy ?? 'Provenance not recorded';
    }, [sourceRef, provenance]);

    const tooltipTitle = useMemo(
        () => (
            <div className="text-[11px] leading-relaxed space-y-1 max-w-[240px]">
                <div><span className="text-white/50">As of:</span> {formattedDate}</div>
                <div><span className="text-white/50">Pipeline:</span> {provenanceLine}</div>
                {provisional && (
                    <div className="text-amber-300/90">
                        Provisional observation — not confirmed by a live upstream fetch.
                    </div>
                )}
            </div>
        ),
        [formattedDate, provenanceLine, provisional]
    );

    const chipSx = useMemo(() => ({
        height: 18,
        fontSize: '0.6rem',
        fontWeight: 900,
        letterSpacing: '0.05em',
        color: `${chipColor}.main`,
        borderColor: `${chipColor}.main`,
        bgcolor: chipBg,
        '& .MuiChip-label': { px: 1 },
        border: '1px solid',
        opacity: 0.9
    }), [chipColor, chipBg]);

    return (
        <Tooltip title={tooltipTitle} arrow placement="top">
            <Chip
                label={displayText}
                size="small"
                variant="outlined"
                sx={chipSx}
            />
        </Tooltip>
    );
};

export const FreshnessChip = React.memo(FreshnessChipInner);