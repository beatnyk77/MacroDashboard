import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Box, useTheme } from '@mui/material';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';

interface ChartProps {
    data: TreasuryHolder[];
}

const COUNTRY_COLORS: Record<string, string> = {
    'Japan': '#1e40af', // Deep Blue
    'United Kingdom': '#3b82f6', // Bright Blue
    'China, Mainland': '#0ea5e9', // Sky Blue
    'Belgium': '#059669', // Emerald
    'Luxembourg': '#10b981', // Green
    'Canada': '#84cc16', // Lime
    'Cayman Islands': '#eab308', // Yellow
    'Switzerland': '#f59e0b', // Amber
    'Ireland': '#f97316', // Orange
    'Taiwan': '#ef4444', // Red
    'India': '#db2777', // Pink
    'Hong Kong': '#a855f7', // Purple
    'Singapore': '#6366f1', // Indigo
    'Brazil': '#8b5cf6', // Violet
    'Norway': '#64748b', // Slate
    'France': '#94a3b8', // Gray
    'Germany': '#cbd5e1', // Light Gray
    'Israel': '#06b6d4', // Cyan
    'Others': '#334155' // Dark Slate
};

const COUNTRY_FLAGS: Record<string, string> = {
    'Japan': '🇯🇵',
    'United Kingdom': '🇬🇧',
    'China, Mainland': '🇨🇳',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Canada': '🇨🇦',
    'Cayman Islands': '🇰🇾',
    'Switzerland': '🇨🇭',
    'Ireland': '🇮🇪',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Norway': '🇳🇴',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Israel': '🇮🇱',
    'Others': '🌐'
};

export const TreasuryHoldersChart: React.FC<ChartProps> = ({ data }) => {
    const theme = useTheme();

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Group by as_of_date
        const grouped = data.reduce((acc, curr) => {
            const date = new Date(curr.as_of_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            if (!acc[date]) {
                acc[date] = { date };
            }
            acc[date][curr.country_name] = curr.holdings_usd_bn;
            return acc;
        }, {} as Record<string, any>);

        // Sort by date (assuming data came in sorted descending, we want ascending for chart)
        return Object.values(grouped).reverse();
    }, [data]);

    const topCountries = useMemo(() => {
        if (!data || data.length === 0) return [];
        const latestDate = data[0].as_of_date;
        return data
            .filter(d => d.as_of_date === latestDate)
            .sort((a, b) => b.holdings_usd_bn - a.holdings_usd_bn)
            .slice(0, 10) // Show top 10 in chart stack
            .map(d => d.country_name);
    }, [data]);

    if (!data || data.length === 0) return null;

    return (
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                        tickFormatter={(value) => `$${value}B`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        labelStyle={{ color: theme.palette.text.secondary, marginBottom: '4px', fontSize: '10px' }}
                        formatter={(value: number, name: string) => [`$${value.toFixed(1)}B`, `${COUNTRY_FLAGS[name] || ''} ${name}`]}
                    />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }}
                        formatter={(value) => (
                            <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                {COUNTRY_FLAGS[value] || ''} {value}
                            </span>
                        )}
                    />
                    {topCountries.map((country, index) => (
                        <Bar
                            key={country}
                            dataKey={country}
                            stackId="a"
                            fill={COUNTRY_COLORS[country] || '#94a3b8'}
                            animationDuration={1500}
                            animationBegin={index * 100}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};
