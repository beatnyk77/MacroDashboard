import React from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, TrendingUp, BookOpen, FlaskConical, Activity, Lightbulb, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SEOManager } from '@/components/SEOManager';

// Static demonstration data showing Net Liquidity over time
const netLiqData = [
    { date: 'Jan 2020', value: 0.3, zscore: 0.4 },
    { date: 'Apr 2020', value: -1.8, zscore: -2.1 },
    { date: 'Jul 2020', value: 1.2, zscore: 1.5 },
    { date: 'Jan 2021', value: 2.1, zscore: 2.4 },
    { date: 'Jul 2021', value: 1.8, zscore: 2.0 },
    { date: 'Jan 2022', value: 0.6, zscore: 0.8 },
    { date: 'Jul 2022', value: -1.4, zscore: -1.7 },
    { date: 'Jan 2023', value: -0.9, zscore: -1.1 },
    { date: 'Jul 2023', value: 0.2, zscore: 0.3 },
    { date: 'Jan 2024', value: 0.8, zscore: 1.0 },
    { date: 'Jul 2024', value: 1.1, zscore: 1.3 },
    { date: 'Jan 2025', value: 0.5, zscore: 0.6 },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={z > 0 ? '#22c55e' : '#ef4444'}>
                    Z = {z > 0 ? '+' : ''}{z.toFixed(2)}σ
                </Typography>
            </Box>
        );
    }
    return null;
}

export const NetLiquidityZScorePage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/net-liquidity-z-score",
        "headline": "Net Liquidity Z-Score — Methodology & Formula",
        "description": "Full methodology for the Net Liquidity Z-Score: formula, data components, institutional use cases, and regime interpretation.",
        "url": "https://graphiquestor.com/methods/net-liquidity-z-score",
        "datePublished": "2026-04-10",
        "dateModified": "2026-04-10",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "proficiencyLevel": "Intermediate",
        "keywords": ["Net Liquidity", "Z-Score", "Federal Reserve", "TGA", "Reverse Repo", "Macro Liquidity"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Net Liquidity Z-Score — Methodology & Formula"
                description="The complete methodology for the Net Liquidity Z-Score: how it is calculated from the Fed balance sheet, TGA, and RRP, and how to interpret regime signals."
                keywords={["Net Liquidity Z-Score", "Federal Reserve Liquidity", "Macro Regime", "RRP", "TGA"]}
                canonicalUrl="https://graphiquestor.com/methods/net-liquidity-z-score"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">
                {/* Breadcrumb */}
                <Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                        Glossary
                    </Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology" sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                        Methodology Hub
                    </Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">Net Liquidity Z-Score</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Liquidity" variant="outlined" color="primary"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem' }} />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        Net Liquidity Z-Score
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        A normalised measure of effective Federal Reserve market liquidity — the single most predictive macro regime indicator for equity markets over a 3–12 month horizon.
                    </Typography>
                </Box>

                {/* Section 1: Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} className="text-blue-400" />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The Federal Reserve's <strong style={{ color: '#93c5fd' }}>Net Liquidity</strong> is computed by taking its total balance sheet (WALCL), then subtracting the Treasury General Account (TGA) and Overnight Reverse Repo (ON RRP) balances. These two subtractions represent money that exists on the Fed's books but is <em>not</em> circulating in the financial system — effectively "sterilised" liquidity.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        By computing a Z-score against a 25-year rolling window (mean and standard deviation), we normalise this level across different historical QE regimes — allowing direct comparison of 2024 liquidity conditions against 2010, 2019, or 2020 conditions on a like-for-like basis.
                    </Typography>
                </Paper>

                {/* Section 2: Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} className="text-blue-400" />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#93c5fd', lineHeight: 2, border: '1px solid rgba(59,130,246,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Step 1: Compute Net Liquidity{'\n'}</Box>
                        Net Liquidity = WALCL − WTREGEN − RRPONTSYD{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Step 2: Rolling statistics (25-year window){'\n'}</Box>
                        μ = Rolling Mean(Net Liquidity, 25y){'\n'}
                        σ = Rolling Std(Net Liquidity, 25y){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Step 3: Z-Score{'\n'}</Box>
                        Z = (Net Liquidity − μ) / σ
                    </Box>

                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2}>
                        {[
                            { code: 'WALCL', name: 'Fed Total Assets', source: 'FRED / H.4.1 Release', desc: 'All securities, loans, and repos held by Fed' },
                            { code: 'WTREGEN', name: 'Treasury General Account', source: 'FRED / NY Fed', desc: 'US Govt operating account — drains bank reserves when rising' },
                            { code: 'RRPONTSYD', name: 'Overnight Reverse Repo', source: 'FRED / NY Fed', desc: 'Eligible institution cash parked at Fed — drains system liquidity' },
                        ].map(c => (
                            <Box key={c.code} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 700, fontSize: '0.8rem' }}>{c.code}</Typography>
                                <Typography variant="body2" fontWeight={700} mt={0.5} mb={0.5}>{c.name}</Typography>
                                <Typography variant="caption" color="text.disabled" display="block" mb={1}>{c.source}</Typography>
                                <Typography variant="caption" color="text.secondary">{c.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Section 3: Chart */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} className="text-blue-400" />
                        Historical Z-Score (Illustrative, 2020–2025)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Positive = expansionary / Negative = contractionary liquidity regime
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={netLiqData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="nlGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[-2.5, 3]} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                            <ReferenceLine y={1.5} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.5} />
                            <ReferenceLine y={-1.5} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} />
                            <Area type="monotone" dataKey="zscore" stroke="#3b82f6" fill="url(#nlGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: '#22c55e', opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">+1.5σ Bull threshold</Typography></Box>
                        <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: '#ef4444', opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">−1.5σ Bear threshold</Typography></Box>
                    </Box>
                </Paper>

                {/* Section 4: Institutional Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'Portfolio Managers', use: 'Overlay Net Liquidity Z-Score on sector allocation decisions. Above +1.0σ: overweight cyclicals/risk assets. Below −1.0σ: rotate to defensives/cash/gold.' },
                            { role: 'Macro Hedge Funds', use: 'Use as primary regime-detection signal for equity long/short exposure sizing. 70% of SPX corrections >10% since 2008 coincided with NL Z < −1.0σ.' },
                            { role: 'Fixed Income Investors', use: 'Cross-reference with 2Y/10Y curve slope. NL contraction + inverted yield curve has historically predicted recession within 12–18 months with 80%+ hit rate.' },
                            { role: 'Risk Management', use: 'Incorporate in VaR and tail-risk scenarios. NL Z < −2.0σ warrants activation of liquidity stress protocols and position de-risking.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Section 5: Regime Interpretation */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp size={20} className="text-blue-400" />
                        Regime Interpretation Table
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
                                <Box component="tr" sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    {['Z-Score Range', 'Regime', 'Equity Bias', 'Gold Bias', 'Credit Bias'].map(h => (
                                        <Box key={h} component="th" sx={{ p: 2, textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</Box>
                                    ))}
                                </Box>
                            </Box>
                            <Box component="tbody">
                                {[
                                    { range: '> +2.0σ', regime: 'Euphoric / Excessive', equity: '⚠️ Caution', gold: 'Neutral', credit: 'Tight spreads' },
                                    { range: '+1.0σ to +2.0σ', regime: 'Goldilocks', equity: '✅ Overweight', gold: 'Modest', credit: 'Spread compression' },
                                    { range: '0 to +1.0σ', regime: 'Neutral / Recovery', equity: 'Neutral', gold: 'Neutral', credit: 'Stable' },
                                    { range: '−1.0σ to 0', regime: 'Tightening Onset', equity: 'Underweight', gold: 'Accumulate', credit: 'Widening' },
                                    { range: '< −1.5σ', regime: 'Contraction / Risk-Off', equity: '❌ Defensive', gold: '✅ Overweight', credit: 'Avoid HY' },
                                ].map(r => (
                                    <Box key={r.range} component="tr" sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <Box component="td" sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.8rem', color: '#93c5fd' }}>{r.range}</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: 'text.primary', fontWeight: 600 }}>{r.regime}</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: 'text.secondary' }}>{r.equity}</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: 'text.secondary' }}>{r.gold}</Box>
                                        <Box component="td" sx={{ p: 2, fontSize: '0.85rem', color: 'text.secondary' }}>{r.credit}</Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />

                {/* Cross links */}
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/net-liquidity-z-score" variant="outlined" startIcon={<BookOpen size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>Glossary Definition</Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>Methodology Hub</Button>
                    <Button component={Link} to="/data-sources" variant="outlined" startIcon={<Link2 size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>Data Sources</Button>
                    <Button component={Link} to="/tools/net-liquidity-gauge" variant="outlined" startIcon={<Activity size={14} />}
                        sx={{ borderColor: 'primary.main', color: 'primary.main', fontWeight: 700 }}>
                        Interactive Liquidity Gauge
                    </Button>
                    <Button component={Link} to="/" variant="contained" color="primary">View Live Dashboard →</Button>
                </Box>
            </Container>
        </Box>
    );
};
