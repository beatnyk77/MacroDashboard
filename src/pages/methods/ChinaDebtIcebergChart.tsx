import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS } from '@/constants/chartDefaults';
import { useLatestChinaDebtLayers, LAYER_META, type ChinaDebtLayerCode } from '@/hooks/useChinaDebt';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

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
            <MacroChartContainer height={CHART_HEIGHTS.standard}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
                    <XAxis {...DEFAULT_XAXIS_PROPS} type="number" domain={[0, 'auto']} unit="%" />
                    <YAxis
                        {...DEFAULT_YAXIS_PROPS}
                        type="category"
                        dataKey="label"
                        width={120}
                    />
                    <Tooltip
                        contentStyle={DEFAULT_TOOLTIP_STYLE}
                        labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                        itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                        formatter={(v: number) => [`${v.toFixed(1)}% GDP`, 'Layer']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={entry.aboveWater ? 1 : 0.75} />
                        ))}
                    </Bar>
                </BarChart>
            </MacroChartContainer>
            <Box display="flex" gap={3} mt={1} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">▲ Blue = MoF-reported (above waterline)</Typography>
                <Typography variant="caption" color="text.secondary">▼ Amber/red = shadow layers (IMF Article IV ranges)</Typography>
            </Box>
        </>
    );
};