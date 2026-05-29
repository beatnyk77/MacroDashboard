import React from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Lightbulb, Link2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';
import { SEOManager } from '@/components/SEOManager';

// Illustrative M2/Gold ratio indexed to 100 at 2000
const ratioData = [
    { year: '2000', ratio: 100, label: 'Gold $279' },
    { year: '2001', ratio: 93,  label: 'Bull begins' },
    { year: '2003', ratio: 84 },
    { year: '2005', ratio: 78 },
    { year: '2007', ratio: 82 },
    { year: '2008', ratio: 98,  label: 'GFC QE' },
    { year: '2009', ratio: 88 },
    { year: '2011', ratio: 72,  label: 'Gold $1,900' },
    { year: '2013', ratio: 88 },
    { year: '2015', ratio: 102, label: 'Gold $1,050' },
    { year: '2017', ratio: 108 },
    { year: '2019', ratio: 112 },
    { year: '2020', ratio: 148, label: 'COVID surge' },
    { year: '2021', ratio: 138 },
    { year: '2022', ratio: 128, label: 'Fed QT' },
    { year: '2023', ratio: 124 },
    { year: '2024', ratio: 118, label: 'Gold $2,400+' },
    { year: '2025', ratio: 108, label: 'Gold $3,000+' },
];

const episodes = [
    {
        period: '2001 – 2011',
        title: 'The Structural Gold Bull',
        ratio: '95 → 72 (−24%)',
        goldMove: '+660% ($250 → $1,900)',
        detail: 'Post dot-com bust, the Fed cut rates aggressively. Global M2 grew, but gold rerated far faster, compressing the ratio from its peak. Every 10-point ratio decline corresponded to gold outperforming the monetary base expansion.',
        color: '#22c55e',
    },
    {
        period: '2011 – 2015',
        title: 'Bear Phase: Gold Underperforms M2',
        ratio: '72 → 102 (+42%)',
        goldMove: '−44% ($1,900 → $1,050)',
        detail: 'Dollar strengthening and Fed tapering drove gold lower while global M2 continued growing. Ratio reverted to its long-run mean, clearing the way for the next bull cycle.',
        color: '#ef4444',
    },
    {
        period: '2020',
        title: 'COVID Debasement Spike',
        ratio: '112 → 148 (+32% in 18 months)',
        goldMove: '+25% (insufficient to absorb M2 surge)',
        detail: 'Central banks injected ~$25 trillion into global M2 in under two years. Gold rose 25%, but the monetary expansion was 5–6× larger in absolute terms. The ratio hit its highest level in 30+ years — setting up the subsequent structural gold re-rating.',
        color: '#f59e0b',
    },
    {
        period: '2022 – 2023',
        title: 'Fed QT Partial Correction',
        ratio: '148 → 124 (−16%)',
        goldMove: '−4% (held relatively firm)',
        detail: 'Aggressive Fed rate hikes and quantitative tightening reduced US M2 by ~$900B. Gold fell less than expected, suggesting structural demand from central bank gold buying was absorbing selling pressure.',
        color: '#3b82f6',
    },
    {
        period: '2024 – 2026',
        title: 'Gold Breakout vs. Re-expanding M2',
        ratio: '124 → ~108 (compressing)',
        goldMove: '+50%+ ($2,000 → $3,000+)',
        detail: 'Gold\'s breakout to $3,000+ has begun compressing the ratio back toward long-run fair value. Fiscal deficits are re-expanding M2, but gold is outpacing — exactly the mean-reversion episode the 2020 spike historically preceded.',
        color: '#a78bfa',
    },
];

const interpretationRows = [
    { signal: 'Ratio rising >10% YoY', regime: 'Debasement Accelerating', implication: 'Gold undervalued vs monetary growth; structural long gold thesis building', color: '#f59e0b' },
    { signal: 'Ratio at cycle high (>2σ)', regime: 'Extreme Overextension', implication: 'Historical mean-reversion precursor; strongest conviction long gold signal', color: '#ef4444' },
    { signal: 'Ratio falling >10% YoY', regime: 'Gold Re-rating Phase', implication: 'Gold outperforming M2; confirm with momentum — trend may extend', color: '#22c55e' },
    { signal: 'Ratio at cycle low (<−1σ)', regime: 'Gold Overvalued vs M2', implication: 'Caution — potential consolidation; reduce tactical exposure', color: '#64748b' },
    { signal: 'Ratio flat, M2 contracting', regime: 'QT / Deflationary Risk', implication: 'Gold may underperform; monitor for demand signals from central banks', color: '#3b82f6' },
];

function RatioTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        const entry = ratioData.find(d => d.year === label);
        return (
            <Box sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 1, minWidth: 160 }}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700} color={val > 130 ? '#ef4444' : val < 85 ? '#22c55e' : '#f59e0b'}>
                    Index: {val}
                </Typography>
                {entry?.label && (
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>{entry.label}</Typography>
                )}
            </Box>
        );
    }
    return null;
}

export const M2GoldRatioPage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/m2-gold-ratio",
        "headline": "M2/Gold Ratio — Methodology, Historical Analysis & Institutional Use Cases",
        "description": "Complete methodology for the M2/Gold Ratio: how global M2 money supply compares to gold market capitalisation as a structural debasement and gold valuation signal.",
        "url": "https://graphiquestor.com/methods/m2-gold-ratio",
        "datePublished": "2026-05-30",
        "dateModified": "2026-05-30",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor", "url": "https://graphiquestor.com" },
        "keywords": ["M2 Gold Ratio", "Gold Valuation", "Monetary Debasement", "Global Liquidity", "Hard Assets", "Gold M2"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="M2/Gold Ratio — Methodology, History & Debasement Signal"
                description="Complete guide to the M2/Gold Ratio: formula, historical episodes from 2001–2026, interpretation framework, and how institutional allocators use it as a gold valuation signal."
                keywords={['M2 gold ratio', 'gold M2 ratio', 'monetary debasement signal', 'gold valuation metric', 'global M2 money supply', 'hard assets macro', 'm2 to gold ratio']}
                canonicalUrl="https://graphiquestor.com/methods/m2-gold-ratio"
                ogType="article"
                publishedTime="2026-05-30"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">

                {/* Breadcrumb */}
                <Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary/m2-gold-ratio" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                        Glossary
                    </Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                        Methodology Hub
                    </Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">M2/Gold Ratio</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Hard Assets"
                        variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                    />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        M2/Gold Ratio
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        A structural debasement gauge: how much global M2 money supply is "covered" by the world's above-ground gold supply at current spot prices. When M2 expands faster than gold, the ratio rises — historically a leading indicator for structural gold re-ratings.
                    </Typography>
                </Box>

                {/* TL;DR */}
                <Paper elevation={0} sx={{ p: 4, mb: 6, bgcolor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3 }}>
                    <Typography variant="overline" sx={{ color: '#f59e0b', fontWeight: 800, letterSpacing: 2 }}>TL;DR</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mt: 1 }}>
                        The M2/Gold Ratio compares global money supply to gold's market cap. The higher the ratio, the more "debased" fiat currencies are relative to the hard asset. The 2020 COVID stimulus pushed the ratio to its highest level in 30 years — a reading that has historically been followed by multi-year gold bull markets as the ratio mean-reverts. As of 2025–2026, gold's breakout above $3,000 is actively compressing the ratio back toward long-run fair value.
                    </Typography>
                </Paper>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} className="text-amber-400" />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The M2/Gold Ratio is a macro valuation metric that asks a fundamental question: <strong style={{ color: '#fcd34d' }}>how much fiat currency has been created relative to the finite stock of hard money that exists in the world?</strong> M2 represents the broadest commonly reported measure of money supply — cash, deposits, and near-money instruments. Gold represents the oldest, most universally recognised store of value with a supply that can only grow ~1.5% per year through mining.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        When central banks expand M2 through quantitative easing, credit creation, or fiscal monetisation, they increase the numerator. When gold prices rise — reflecting increased demand for monetary insurance — the denominator rises. The ratio captures the <em>relative velocity</em> of each: a rising ratio means fiat is being created faster than gold is being repriced to reflect it, implying gold is structurally undervalued relative to the monetary base.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        Unlike price-to-earnings or yield-based valuation models, the M2/Gold Ratio has no earnings cycle distortion, no duration risk, and no issuer credit risk. It measures a simple mechanical relationship: the claims on value created by printing vs. the hard asset intended to constrain it.
                    </Typography>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#f59e0b' }} />
                        Formula &amp; Data Components
                    </Typography>
                    <Box sx={{ p: 3, mb: 4, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#fcd34d', lineHeight: 2.2, border: '1px solid rgba(245,158,11,0.15)', overflowX: 'auto' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Numerator: Global M2{'\n'}</Box>
                        Global M2 = US M2 + Eurozone M2 + China M2 + Japan M2 + UK M2 + RoW M2{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Denominator: Above-Ground Gold Market Cap{'\n'}</Box>
                        Gold Mkt Cap = 212,582 tonnes × 32,150.7 oz/tonne × XAU/USD spot{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># The Ratio{'\n'}</Box>
                        M2/Gold = Global M2 (USD) / Gold Market Cap (USD)
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'US M2 (FRED: M2SL)', desc: 'Federal Reserve H.6 release — weekly, seasonally adjusted. Largest single M2 contributor (~$21T).' },
                            { label: 'Eurozone M2 (ECB)', desc: 'ECB Statistical Data Warehouse — monthly. Second largest block (~€15T equivalent).' },
                            { label: 'China M2 (PBoC)', desc: 'PBoC monthly M2 release — fastest-growing major M2, now rivals US in absolute terms.' },
                            { label: 'Gold Supply: 212,582t', desc: 'World Gold Council estimate of total above-ground gold ever mined. Grows ~3,500t/year (~1.7%).' },
                            { label: 'XAU/USD Spot', desc: 'LBMA PM Gold Fix — daily benchmark used by central banks and institutional market makers.' },
                            { label: 'Update Frequency', desc: 'Monthly (constrained by M2 publication lag from ECB and PBoC). US M2 updates weekly.' },
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
                        M2/Gold Ratio — Historical Index (2000–2026, Illustrative)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Indexed to 100 at year-2000. Rising = gold undervalued vs M2. Falling = gold reration phase. Amber band = historical extreme zone (&gt;130).
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={ratioData} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[60, 160]} />
                            <Tooltip content={<RatioTooltip />} />
                            <ReferenceArea y1={130} y2={160} fill="rgba(245,158,11,0.06)" />
                            <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.5}
                                label={{ value: 'Extreme zone', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
                            <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                            <Line
                                type="monotone"
                                dataKey="ratio"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, fill: '#f59e0b' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
                        Note: Illustrative reconstruction using publicly available M2 and gold price data. Live readings available on the GraphiQuestor M2/Gold Ratio glossary page.
                    </Typography>
                </Paper>

                {/* Interpretation Framework */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp size={20} style={{ color: '#f59e0b' }} />
                        Interpretation Framework
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.75 }}>
                        The ratio is most useful as a <strong>regime classifier</strong>, not a market-timing tool. It identifies structural conditions that favour gold over multi-year horizons, not tactical entry points. Use in conjunction with positioning data, central bank demand, and real interest rate signals.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {interpretationRows.map((row) => (
                            <Box key={row.signal} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 2fr' }, gap: 2, alignItems: 'start' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: row.color, fontWeight: 700, fontFamily: 'monospace' }}>{row.signal}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: row.color, fontWeight: 600 }}>{row.regime}</Typography>
                                <Typography variant="caption" color="text.secondary">{row.implication}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Historical Episodes */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Database size={20} style={{ color: '#f59e0b' }} />
                        Five Key Historical Episodes
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                        {episodes.map((ep) => (
                            <Box key={ep.period} sx={{ p: 4, borderRadius: 2, border: `1px solid ${ep.color}22`, bgcolor: `${ep.color}08` }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1.5}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: ep.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{ep.period}</Typography>
                                        <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>{ep.title}</Typography>
                                    </Box>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        <Chip size="small" label={`Ratio: ${ep.ratio}`} sx={{ bgcolor: `${ep.color}18`, color: ep.color, fontWeight: 700, fontSize: '0.7rem' }} />
                                        <Chip size="small" label={`Gold: ${ep.goldMove}`} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontSize: '0.7rem' }} />
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>{ep.detail}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Institutional Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mt={2}>
                        {[
                            {
                                role: 'Macro Hedge Funds',
                                use: 'Use ratio extremes as conviction-building signals for structural long gold positioning with 18–36 month horizons. The 2020 spike to 30-year highs provided the analytical foundation for many flagship macro funds\' gold positions that subsequently returned 40–80%.',
                            },
                            {
                                role: 'Central Banks & Sovereign Wealth Funds',
                                use: 'Provides quantitative justification for reserve diversification from USD-denominated assets into gold. PBoC and EM central banks have been net buyers since 2022 — the ratio offers a valuation framework for timing accumulation programs.',
                            },
                            {
                                role: 'Family Offices & Endowments',
                                use: 'Long-run portfolio insurance sizing. A ratio at extreme highs increases the theoretically optimal gold allocation in a mean-variance portfolio. Endowments with 5–10 year investment horizons use it to justify overweight hard asset positions.',
                            },
                            {
                                role: 'Commodity Trading Advisors (CTAs)',
                                use: 'Non-momentum confirmation signal for gold futures positioning. Reduces false reversal signals from technical-only approaches by anchoring to a fundamental debasement thesis. Most effective as a filter on momentum systems.',
                            },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f59e0b', mb: 1.5 }}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Limitations */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#ef4444' }}>
                        Known Limitations
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2, color: 'text.secondary' }}>
                        {[
                            'Global M2 aggregation introduces FX translation effects — a stronger dollar artificially compresses non-US M2 in USD terms.',
                            'Above-ground gold estimates (World Gold Council) carry ±5% uncertainty; recycling rates and unreported hoards are unquantifiable.',
                            'The ratio has no mean-reversion timeline — it can remain at extremes for 3–5 years before correcting, making it unsuitable for tactical short-term positioning.',
                            'Does not capture other hard assets (silver, commodities, real estate) that also absorb monetary debasement. A multi-asset debasement index is theoretically more complete.',
                        ].map(l => (
                            <Box component="li" key={l} sx={{ mb: 1.5, lineHeight: 1.75 }}>
                                <Typography variant="body2" color="text.secondary">{l}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />

                {/* Footer nav */}
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/m2-gold-ratio" variant="outlined" startIcon={<BookOpen size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                        Glossary Definition
                    </Button>
                    <Button component={Link} to="/glossary/debt-gold-z-score" variant="outlined" startIcon={<Link2 size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                        Debt/Gold Z-Score
                    </Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                        Methodology Hub
                    </Button>
                    <Button component={Link} to="/labs/de-dollarization-gold" variant="contained" color="primary">
                        View De-Dollarization Lab →
                    </Button>
                </Box>

            </Container>
        </Box>
    );
};
