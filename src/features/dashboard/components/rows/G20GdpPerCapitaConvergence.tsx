import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import {
    Box,
    Typography,
    Card,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    alpha
} from '@mui/material';
import { TrendingUp } from 'lucide-react';
import { useG20GdpConvergence } from '@/hooks/useG20GdpConvergence';
import { motion, AnimatePresence } from 'framer-motion';

const G20_COUNTRIES = [
    { code: 'USA', name: 'USA', color: '#3b82f6' },
    { code: 'IND', name: 'India', color: '#f59e0b' },
    { code: 'CHN', name: 'China', color: '#ef4444' },
    { code: 'DEU', name: 'Germany', color: '#10b981' },
    { code: 'BRA', name: 'Brazil', color: '#8b5cf6' },
    { code: 'JPN', name: 'Japan', color: '#ec4899' },
    { code: 'EU27', name: 'EU', color: '#6366f1' },
    { code: 'IDN', name: 'Indonesia', color: '#06b6d4' },
    { code: 'RUS', name: 'Russia', color: '#4b5563' },
];

const BASE_YEARS = [2008, 2015, 2020];

export const G20GdpPerCapitaConvergence: React.FC = () => {
    const { data, isLoading } = useG20GdpConvergence();
    const [baseYear, setBaseYear] = useState(2008);
    const [selectedCountries, setSelectedCountries] = useState(['USA', 'IND', 'CHN', 'EU27', 'JPN']);

    const chartData = useMemo(() => {
        if (!data) return [];

        // Group by year
        const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

        // Find base year values
        const baseValues: Record<string, number> = {};
        data.filter(d => d.year === baseYear).forEach(d => {
            baseValues[d.country_code] = d.value_constant_usd;
        });

        return years.map(year => {
            const row: any = { year };
            data.filter(d => d.year === year).forEach(d => {
                const baseVal = baseValues[d.country_code];
                if (baseVal) {
                    // Indexed to 100 at base year
                    row[d.country_code] = (d.value_constant_usd / baseVal) * 100;
                }
            });
            return row;
        }).filter(r => Object.keys(r).length > 1); // Filtering rows with at least one country value
    }, [data, baseYear]);

    const handleCountryToggle = (code: string) => {
        setSelectedCountries(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    if (isLoading) return null;

    // Highlights for the callouts
    const indiaGrowth = chartData.length > 0 ? (chartData[chartData.length - 1]['IND'] - 100).toFixed(0) : 0;
    const usaGrowth = chartData.length > 0 ? (chartData[chartData.length - 1]['USA'] - 100).toFixed(0) : 0;
    const chinaGrowth = chartData.length > 0 ? (chartData[chartData.length - 1]['CHN'] - 100).toFixed(0) : 0;

    return (
        <Card sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px'
        }}>
            <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em', color: 'common.white', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TrendingUp size={24} className="text-blue-500" />
                        G20 GDP Convergence Monitor
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                        Real GDP per capita (PPP) indexed to 100. Visualizing the relative trajectory of emerging vs. advanced economies since key macro pivot points.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: { md: 'flex-end' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Base Year
                    </Typography>
                    <ToggleButtonGroup
                        value={baseYear}
                        exclusive
                        onChange={(_, val) => val && setBaseYear(val)}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                color: 'text.secondary',
                                px: 3,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'common.white',
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }
                            }
                        }}
                    >
                        {BASE_YEARS.map(year => (
                            <ToggleButton key={year} value={year}>
                                {year}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <AnimatePresence mode="wait">
                <motion.div
                    key={baseYear}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <Box sx={{ height: 450, width: '100%', mb: 4 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ fontSize: '0.8rem', fontWeight: 600 }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 700 }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{G20_COUNTRIES.find(c => c.code === value)?.name}</span>}
                                />
                                <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" />
                                {G20_COUNTRIES.map(country => (
                                    selectedCountries.includes(country.code) && (
                                        <Line
                                            key={country.code}
                                            type="monotone"
                                            dataKey={country.code}
                                            stroke={country.color}
                                            strokeWidth={country.code === 'IND' ? 4 : 2}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            animationDuration={1500}
                                        />
                                    )
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </motion.div>
            </AnimatePresence>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {G20_COUNTRIES.map(country => (
                    <Chip
                        key={country.code}
                        label={country.name}
                        onClick={() => handleCountryToggle(country.code)}
                        variant={selectedCountries.includes(country.code) ? 'filled' : 'outlined'}
                        sx={{
                            cursor: 'pointer',
                            borderColor: alpha(country.color, 0.3),
                            color: selectedCountries.includes(country.code) ? '#fff' : alpha('#fff', 0.5),
                            bgcolor: selectedCountries.includes(country.code) ? alpha(country.color, 0.8) : 'transparent',
                            '&:hover': {
                                bgcolor: selectedCountries.includes(country.code) ? country.color : alpha(country.color, 0.1),
                                borderColor: country.color
                            },
                        }}
                    />
                ))}
            </Box>

            <Box sx={{ mt: 6, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
                <Box sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#f59e0b', 0.05), border: '1px solid ' + alpha('#f59e0b', 0.1) }}>
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                        Emerging Force (IND)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'common.white' }}>
                        India: +{indiaGrowth}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Fastest convergence trajectory in the group.
                    </Typography>
                </Box>
                <Box sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#ef4444', 0.05), border: '1px solid ' + alpha('#ef4444', 0.1) }}>
                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                        Economic Titan (CHN)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'common.white' }}>
                        China: +{chinaGrowth}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Massive scale shift since {baseYear}.
                    </Typography>
                </Box>
                <Box sx={{ p: 3, borderRadius: '16px', bgcolor: alpha('#3b82f6', 0.05), border: '1px solid ' + alpha('#3b82f6', 0.1) }}>
                    <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                        Advanced Benchmark (USA)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'common.white' }}>
                        USA: +{usaGrowth}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Resilient baseline for advanced economies.
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};
