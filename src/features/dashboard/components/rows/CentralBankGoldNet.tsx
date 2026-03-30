
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Tooltip as MuiTooltip, Typography, Box
} from '@mui/material';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip as RechartsTooltip, CartesianGrid, Cell
} from 'recharts';
import { Scale, Info, TrendingUp } from 'lucide-react';
// import { SPASection } from '@/components/spa/SPASection'; // Removed to avoid nesting
import { SectionHeader } from '@/components/SectionHeader';
import { useCentralBankGoldNet, TopCountry } from '@/hooks/useCentralBankGoldNet';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const CentralBankGoldNet: React.FC = () => {
    const { data: periods, isLoading } = useCentralBankGoldNet();

    // Prepare data for the Since 2020 stacked chart
    const chartData = useMemo(() => {
        if (!periods) return [];
        const p2020 = periods.find(p => p.period_start_year === 2020);
        if (!p2020) return [];

        // Combine buyers and sellers into a single dataset for visualization
        // Show top 5 of each
        const topBuyers = (p2020.top_buyers_json || []).slice(0, 5);
        const topSellers = (p2020.top_sellers_json || []).slice(0, 5);

        return [
            ...topBuyers.map(b => ({ name: b.country, type: 'Buy', value: b.tonnes })),
            ...topSellers.map(s => ({ name: s.country, type: 'Sell', value: -s.tonnes })) // Negative for selling
        ];
    }, [periods]);

    if (isLoading) {
        return (
            <div className="py-12">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-neutral-400">Loading Central Bank Gold Data...</div>
                </div>
            </div>
        );
    }

    if (!periods || periods.length === 0) return null;

    return (
        <div id="central-bank-gold-net" className="py-12">
            <SectionHeader
                title="Central Bank Gold Net Purchases"
                subtitle="Multi-Period Accumulation Trends (Source: IMF IFS / World Gold Council)"
                icon={<Scale className="w-6 h-6 text-yellow-500" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Main Data Table */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <TableContainer component={Paper} className="bg-neutral-900/50 backdrop-blur-sm border border-white/12 rounded-xl overflow-hidden shadow-2xl">
                        <Table aria-label="central bank gold net purchases table">
                            <TableHead className="bg-white/5">
                                <TableRow>
                                    <TableCell className="text-neutral-400 font-medium border-b border-white/12">Period</TableCell>
                                    <TableCell align="right" className="text-emerald-400 font-medium border-b border-white/12">Gross Buyers (t)</TableCell>
                                    <TableCell align="right" className="text-rose-400 font-medium border-b border-white/12">Gross Sellers (t)</TableCell>
                                    <TableCell align="right" className="text-yellow-400 font-bold border-b border-white/12">Net Change (t)</TableCell>
                                    <TableCell align="right" className="text-neutral-400 font-medium border-b border-white/12">% Global Stock</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {periods.map((row) => (
                                    <TableRow key={row.period_start_year} className="hover:bg-white/5 transition-colors group">
                                        <TableCell component="th" scope="row" className="text-white font-medium border-b border-white/5">
                                            {row.period_label}
                                        </TableCell>
                                        <TableCell align="right" className="text-emerald-300 font-mono border-b border-white/5 cursor-help">
                                            <MuiTooltip
                                                title={
                                                    <Box sx={{ p: 1 }}>
                                                        <Typography variant="subtitle2" color="white" gutterBottom>Top Buyers:</Typography>
                                                        {(row.top_buyers_json as TopCountry[])?.slice(0, 5).map((b, i) => (
                                                            <div key={b.code || i} className="flex justify-between text-xs gap-4 text-emerald-200">
                                                                <span>{b.country}</span>
                                                                <span>{b.tonnes.toLocaleString()}t</span>
                                                            </div>
                                                        ))}
                                                    </Box>
                                                }
                                                arrow
                                                placement="top"
                                            >
                                                <span className="border-b border-dashed border-emerald-500/30 pb-0.5">
                                                    {row.buyers_tonnes?.toLocaleString()}
                                                </span>
                                            </MuiTooltip>
                                        </TableCell>
                                        <TableCell align="right" className="text-rose-300 font-mono border-b border-white/5 cursor-help">
                                            <MuiTooltip
                                                title={
                                                    <Box sx={{ p: 1 }}>
                                                        <Typography variant="subtitle2" color="white" gutterBottom>Top Sellers:</Typography>
                                                        {(row.top_sellers_json as TopCountry[])?.slice(0, 5).map((s, i) => (
                                                            <div key={s.code || i} className="flex justify-between text-xs gap-4 text-rose-200">
                                                                <span>{s.country}</span>
                                                                <span>{s.tonnes.toLocaleString()}t</span>
                                                            </div>
                                                        ))}
                                                    </Box>
                                                }
                                                arrow
                                                placement="top"
                                            >
                                                <span className="border-b border-dashed border-rose-500/30 pb-0.5">
                                                    {row.sellers_tonnes?.toLocaleString()}
                                                </span>
                                            </MuiTooltip>
                                        </TableCell>
                                        <TableCell align="right" className="font-bold border-b border-white/5 text-lg">
                                            <span className={(row.net_tonnes || 0) >= 0 ? "text-yellow-400" : "text-neutral-400"}>
                                                {(row.net_tonnes || 0) > 0 ? '+' : ''}{row.net_tonnes?.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className="text-neutral-300 font-mono border-b border-white/5">
                                            {row.net_pct_global_stock}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <div className="mt-4 text-xs text-neutral-500 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        <span>Hover over values to see top contributing central banks. % Global Stock based on ~212k tonnes above-ground estimate.</span>
                    </div>
                </motion.div>

                {/* Inset Chart: Since 2020 Breakdown */}
                <motion.div variants={itemVariants} className="bg-neutral-900/50 backdrop-blur-sm border border-white/12 rounded-xl p-6 shadow-2xl flex flex-col h-[400px]">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Since 2020 Breakdown
                    </h3>
                    <p className="text-sm text-neutral-400 mb-6">Top 5 Buyers vs Sellers (Tonnes)</p>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#525252"
                                    tick={{ fill: '#a3a3a3', fontSize: 11 }}
                                    width={100}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    formatter={(value: number) => [`${Math.abs(value).toLocaleString()} t`, value > 0 ? 'Buy' : 'Sell']}
                                />
                                <Bar dataKey="value" name="Net Change" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.type === 'Buy' ? '#34d399' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
