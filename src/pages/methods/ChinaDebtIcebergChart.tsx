import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useLatestChinaDebtLayers, LAYER_META, type ChinaDebtLayerCode } from '@/hooks/useChinaDebt';

const STACK_ORDER: ChinaDebtLayerCode[] = [
    'central_official',
    'local_gov',
    'lgfv',
    'policy_bank',
    'soe_contingent',
];

function layerValue(row: { value_high_pct_gdp: number | null; value_pct_gdp: number | null }) {
    return row.value_high_pct_gdp ?? row.value_pct_gdp ?? 0;
}

export const ChinaDebtIcebergChart: React.FC = () => {
    const { data: layersByCode, isLoading } = useLatestChinaDebtLayers();

    const chartData = useMemo(() => {
        return STACK_ORDER.map(code => {
            const row = layersByCode[code];
            const meta = LAYER_META[code];
            return {
                code,
                label: meta.label.replace(' (Implicit LG)', '').replace(' (Explicit)', ''),
                value: row ? layerValue(row) : 0,
                aboveWater: meta.aboveWater,
                color: meta.color,
                hasData: !!row,
            };
        }).filter(d => d.hasData);
    }, [layersByCode]);

    if (isLoading) {
        return (
            <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">Loading layer data…</Typography>
            </Box>
        );
    }

    if (chartData.length === 0) {
        return (
            <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">China debt layer data unavailable</Typography>
            </Box>
        );
    }

    return (
        <>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <YAxis
                        type="category"
                        dataKey="label"
                        width={120}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v.toFixed(1)}% GDP`, 'Layer']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={entry.aboveWater ? 1 : 0.75} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <Box display="flex" gap={3} mt={1} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">▲ Blue = MoF-reported (above waterline)</Typography>
                <Typography variant="caption" color="text.secondary">▼ Amber/red = shadow layers (IMF Article IV ranges)</Typography>
            </Box>
        </>
    );
};