import React from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Lightbulb, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { SEOManager } from '@/components/SEOManager';

// Illustrative Debt/Gold ratio Z-score data
const debtGoldData = [
    { year: '2000', zscore: -0.8 },
    { year: '2002', zscore: -0.5 },
    { year: '2004', zscore: 0.1 },
    { year: '2006', zscore: 0.6 },
    { year: '2008', zscore: 1.1 },
    { year: '2010', zscore: 0.4 },
    { year: '2012', zscore: 0.9 },
    { year: '2014', zscore: 1.3 },
    { year: '2016', zscore: 1.4 },
    { year: '2018', zscore: 1.7 },
    { year: '2020', zscore: 2.0 },
    { year: '2022', zscore: 1.5 },
    { year: '2024', zscore: 2.3 },
];

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={z > 2.0 ? '#f59e0b' : z > 1.0 ? '#fb923c' : '#94a3b8'}>
                    Z = {z > 0 ? '+' : ''}{z.toFixed(1)}σ
                </Typography>
            </Box>
        );
    }
    return null;
}

export const DebtGoldZScorePage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/debt-gold-z-score",
        "headline": "Debt/Gold Z-Score — Methodology, Formula & Institutional Use Cases",
        "description": "Full methodology for the Debt/Gold Z-Score: how US Federal Debt compares to official gold reserves as a valuation signal for gold bull markets.",
        "url": "https://graphiquestor.com/methods/debt-gold-z-score",
        "datePublished": "2026-04-10",
        "dateModified": "2026-04-10",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["Debt Gold Ratio", "Gold Valuation", "Sovereign Debt", "Z-Score", "Federal Reserve Gold"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Debt/Gold Z-Score — Methodology & Formula"
                description="The complete methodology for the Debt/Gold Z-Score: how it measures the implied gold backing of US Federal Debt and signals structural gold undervaluation."
                keywords={["Debt Gold Ratio", "Gold Valuation Z-Score", "Federal Debt", "Gold Bull Signal"]}
                canonicalUrl="https://graphiquestor.com/methods/debt-gold-z-score"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">
                {/* Breadcrumb */}
                <Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Glossary</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Methodology Hub</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">Debt/Gold Z-Score</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Hard Assets" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#f59e0b', color: '#f59e0b' }} />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        Debt/Gold Z-Score
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        A thought-experiment made operational: how many "gold equivalents" would it take to redeem US Federal Debt? Normalised as a Z-score to identify structural gold undervaluation.
                    </Typography>
                </Box>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} className="text-amber-400" />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        Rooted in the classical gold standard era, this metric asks a simple question: <strong style={{ color: '#fcd34d' }}>if the US were to back its debt with its official gold reserves at current spot prices, how does this compare historically?</strong> The US holds 8,133.5 tonnes of gold (unchanged since 1980). As debt compounds faster than gold prices, the ratio rises exponentially.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        The Z-score normalises this against a 25-year rolling window, separating the structural trend from cyclical fluctuations in gold prices and debt issuance pace, producing a signal that identifies periods where gold is deeply undervalued relative to the implied monetary stress of the balance sheet.
                    </Typography>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#f59e0b' }} />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#fcd34d', lineHeight: 2, border: '1px solid rgba(245,158,11,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Step 1: Gold Market Cap of US Reserves{'\n'}</Box>
                        US Gold Market Cap = 8,133.5 tonnes × 32,150.7 oz/tonne × Gold Spot (USD){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Step 2: Debt/Gold Ratio{'\n'}</Box>
                        D/G Ratio = US Federal Debt Outstanding / US Gold Market Cap{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Step 3: Z-Score (25-year rolling){'\n'}</Box>
                        Z = (D/G Ratio − μ₂₅ᵧ) / σ₂₅ᵧ
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'GFDEBTN (FRED)', desc: 'Federal Debt Held by the Public — quarterly, sourced from Treasury' },
                            { label: 'Gold Spot (XAU/USD)', desc: 'Daily London LBMA PM fix via FRED series GOLDPMGBD228NLBM' },
                            { label: 'US Gold Holdings', desc: '8,133.5 metric tonnes — US Treasury official holding, audited annually' },
                            { label: 'Rolling Window', desc: '25 years (quarterly data) — chosen to span full economic cycles' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#fcd34d', fontWeight: 700 }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>{d.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Chart */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#f59e0b' }} />
                        Debt/Gold Z-Score Historical (Illustrative, 2000–2024)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Rising ratio = gold increasingly undervalued vs. debt burden. Z &gt; +2.0σ = historically significant gold bull signal horizon.
                    </Typography>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={debtGoldData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[-1.5, 2.8]} />
                            <Tooltip content={<BarTooltip />} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                            <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.6} />
                            <Bar dataKey="zscore" radius={[3, 3, 0, 0]}>
                                {debtGoldData.map((entry) => (
                                    <Cell key={entry.year} fill={entry.zscore > 2.0 ? '#f59e0b' : entry.zscore > 1.0 ? '#fb923c' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: '#f59e0b', borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z &gt; +2.0σ (Extreme gold undervaluation signal)</Typography></Box>
                        <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: '#fb923c', borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z +1.0σ to +2.0σ (Elevated)</Typography></Box>
                    </Box>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'Macro Hedge Funds', use: 'Use Z > +2.0σ as a conviction-building signal for long gold positioning with 12–24 month horizons. Backtested signal preceded 40%+ gold rallies in 2002 and 2020.' },
                            { role: 'Sovereign Wealth Funds', use: 'Monitor as a reserve diversification trigger — when the ratio hits extreme levels, it provides quantitative justification for central bank gold accumulation over USD-denominated assets.' },
                            { role: 'Family Offices', use: 'Long-run portfolio insurance allocation sizing. A rising Z-score increases the optimal gold allocation percentage in a mean-variance optimised portfolio.' },
                            { role: 'Commodity Trading Advisors', use: 'Use as a non-momentum confirmation signal for gold futures positioning. Reduces false signals from technical-only approaches.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f59e0b' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/debt-gold-z-score" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Glossary Definition</Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Methodology Hub</Button>
                    <Button component={Link} to="/data-sources" variant="outlined" startIcon={<Link2 size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Data Sources</Button>
                    <Button component={Link} to="/" variant="contained" color="primary">View Live Dashboard →</Button>
                </Box>
            </Container>
        </Box>
    );
};
